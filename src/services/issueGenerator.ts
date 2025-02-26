import * as vscode from 'vscode';
import { OpenAIService, OpenAIServiceFactory } from './openai';
import { GitService, GitServiceFactory } from './git';
import { GitHubService, GitHubServiceFactory } from './github';
import { BaseService, BaseServiceFactory } from './base';
import { ServiceConfig } from '../types';
import {
    IssueType,
    IssueGenerationParams,
    GeneratedIssueContent
} from '../types/issue';

interface FileAnalysis {
    path: string;
    content?: string;
    type?: string;
    error?: string;
}

export class IssueGeneratorService extends BaseService {
    constructor(
        private readonly openai: OpenAIService,
        private readonly github: GitHubService,
        private readonly git: GitService,
        config?: Partial<ServiceConfig>
    ) {
        super(config);
    }

    async getTrackedFiles(): Promise<string[]> {
        return this.git.getTrackedFiles();
    }

    getAvailableTypes(): IssueType[] {
        const useEmoji = this.config.useEmoji || false;

        return [
            {
                label: useEmoji ? '📋 Task' : 'Task',
                description: 'General task or improvement',
                type: 'task'
            },
            {
                label: useEmoji ? '🐛 Bug Report' : 'Bug Report',
                description: 'Report a bug',
                type: 'bug'
            },
            {
                label: useEmoji ? '✨ Feature Request' : 'Feature Request',
                description: 'Request a new feature',
                type: 'feature'
            },
            {
                label: useEmoji ? '📝 Documentation' : 'Documentation',
                description: 'Documentation improvement',
                type: 'docs'
            },
            {
                label: useEmoji ? '🔧 Refactoring' : 'Refactoring',
                description: 'Code improvement',
                type: 'refactor'
            }
        ];
    }

    private async generateTitle(type: string, description: string): Promise<string> {
        try {
            const title = await this.openai.createChatCompletion({
                prompt: `Create a concise title (maximum 50 characters) in ${this.config.language || 'english'} for this ${type} based on the following description:\n\n${description}\n\nRequirements:\n- Must be in ${this.config.language || 'english'}\n- Maximum 50 characters\n- Clear and descriptive\n- No technical jargon unless necessary`,
                temperature: 0.1,
                maxTokens: 50
            });

            return title || description.slice(0, 50);
        } catch (error) {
            this.showError('Failed to generate title', error);
            return description.slice(0, 50);
        }
    }

    private async analyzeFiles(files: string[]): Promise<FileAnalysis[]> {
        const analyses: FileAnalysis[] = [];
        const maxPreviewLength = 1000; // ファイルごとのプレビュー最大文字数

        for (const file of files) {
            try {
                const fileUri = vscode.Uri.file(file);
                const fileContent = await vscode.workspace.fs.readFile(fileUri);
                const decoder = new TextDecoder();
                let content = decoder.decode(fileContent);

                // ファイル拡張子から種類を判定
                const extension = file.split('.').pop()?.toLowerCase();
                const type = this.getFileType(extension);

                // ファイルの内容を要約（最初の1000文字まで）
                if (content.length > maxPreviewLength) {
                    content = content.substring(0, maxPreviewLength) + '\n... (content truncated)';
                }

                analyses.push({
                    path: file,
                    content: content,
                    type: type
                });
            } catch (error) {
                analyses.push({
                    path: file,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return analyses;
    }

    private getFileType(extension: string | undefined): string {
        const typeMap: { [key: string]: string } = {
            ts: 'TypeScript',
            js: 'JavaScript',
            jsx: 'React JavaScript',
            tsx: 'React TypeScript',
            css: 'CSS',
            scss: 'SCSS',
            html: 'HTML',
            json: 'JSON',
            md: 'Markdown',
            py: 'Python',
            java: 'Java',
            cpp: 'C++',
            c: 'C',
            go: 'Go',
            rs: 'Rust',
            php: 'PHP',
            rb: 'Ruby'
        };

        return extension ? (typeMap[extension] || 'Unknown') : 'Unknown';
    }

    private formatAnalysisResult(analyses: FileAnalysis[]): string {
        let result = '# Repository Analysis\n\n';

        // ファイルタイプごとにグループ化
        const groupedByType = analyses.reduce((groups: { [key: string]: FileAnalysis[] }, analysis) => {
            const type = analysis.type || 'Unknown';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(analysis);
            return groups;
        }, {});

        // 各タイプのファイルをまとめて表示
        for (const [type, files] of Object.entries(groupedByType)) {
            result += `## ${type} Files\n\n`;
            for (const file of files) {
                result += `### ${file.path}\n\n`;
                if (file.error) {
                    result += `Error: ${file.error}\n\n`;
                } else if (file.content) {
                    result += '```' + (type.toLowerCase().includes('typescript') ? 'typescript' : '') + '\n';
                    result += file.content;
                    result += '\n```\n\n';
                }
            }
        }

        return result;
    }

    async generatePreview(params: IssueGenerationParams): Promise<GeneratedIssueContent> {
        try {
            // ファイル解析
            const fileAnalyses = params.files && params.files.length > 0
                ? await this.analyzeFiles(params.files)
                : [];
            
            const analysisResult = this.formatAnalysisResult(fileAnalyses);

            const prompt = `${params.type.type === 'task' ? 'issue.task' : 'issue.standard'}`;
            const body = await this.openai.createChatCompletion({
                prompt: `${prompt}\n\nRepository Analysis:\n${analysisResult}\n\nUser Description: ${params.description}`,
                maxTokens: 1000,
                temperature: 0.1
            });

            if (!body) throw new Error('Failed to generate content');
            const title = await this.generateTitle(params.type.type, params.description);

            return { title, body };
        } catch (error) {
            throw new Error(`Failed to generate preview: ${error}`);
        }
    }

    async createIssue(content: GeneratedIssueContent, type: IssueType): Promise<string | undefined> {
        try {
            const useEmoji = this.config.useEmoji || false;

            const issueTitle = useEmoji 
                ? `${type.label.split(' ')[0]} ${content.title}`
                : `[${type.type}] ${content.title}`;

            const issue = await this.github.createIssue({
                title: issueTitle,
                body: content.body
            });

            return issue.html_url;
        } catch (error) {
            this.showError('Failed to create issue', error);
            return undefined;
        }
    }
}

export class IssueGeneratorServiceFactory extends BaseServiceFactory<IssueGeneratorService> {
    async create(config?: Partial<ServiceConfig>): Promise<IssueGeneratorService> {
        const [openai, github, git] = await Promise.all([
            OpenAIServiceFactory.initialize(config),
            GitHubServiceFactory.initialize(config),
            GitServiceFactory.initialize(config)
        ]);

        if (!openai || !github || !git) {
            throw new Error('Failed to initialize required services');
        }

        return new IssueGeneratorService(openai, github, git, config);
    }

    static async initialize(config?: Partial<ServiceConfig>): Promise<IssueGeneratorService | undefined> {
        try {
            const factory = new IssueGeneratorServiceFactory();
            return await factory.create(config);
        } catch (error) {
            console.error('Failed to initialize Issue Generator service:', error);
            vscode.window.showErrorMessage(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to initialize Issue Generator service'
            );
            return undefined;
        }
    }
}