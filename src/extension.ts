import * as vscode from 'vscode';
import axios from 'axios';

interface GitExtension {
    getAPI(version: number): GitAPI;
}

interface GitAPI {
    repositories: Repository[];
    onDidChangeState: (listener: () => void) => vscode.Disposable;
}

interface Repository {
    inputBox: {
        value: string;
        placeholder: string;
    };
    diff(staged: boolean): Promise<string>;
    state: {
        indexChanges: string[];
        workingTreeChanges: string[];
    };
    add(paths: string[]): Promise<void>;
}

interface LanguageConfig {
    name: string;
    systemPrompt: (style: MessageStyle) => string;
    diffMessage: string;
}

type MessageStyle = 'simple' | 'normal' | 'detailed';

interface MessageStyleConfig {
    tokens: number;
    description: string;
}

const COMMIT_PREFIX_GUIDE = `
# ==== Prefix ====
# fix:      A bug fix
# feat:     A new feature
# docs:     Documentation only changes
# style:    Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
# refactor: A code change that neither fixes a bug nor adds a feature
# perf:     A code change that improves performance
# test:     Adding missing or correcting existing tests
# chore:    Changes to the build process or auxiliary tools and libraries such as documentation generation
`;

const MESSAGE_STYLES: Record<MessageStyle, MessageStyleConfig> = {
    simple: {
        tokens: 100,
        description: "Generate a very concise commit message focusing only on the core change."
    },
    normal: {
        tokens: 200,
        description: "Generate a commit message with a brief explanation of the changes."
    },
    detailed: {
        tokens: 500,
        description: "Generate a detailed commit message including context, reasoning, and impact of the changes."
    }
};

const LANGUAGE_CONFIGS: { [key: string]: LanguageConfig } = {
    english: {
        name: 'English',
        systemPrompt: (style) => `You are a commit message expert. ${MESSAGE_STYLES[style].description} Follow the Conventional Commits format with these prefixes:${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "Generate a commit message for the following Git diff:"
    },
    french: {
        name: 'Français',
        systemPrompt: (style) => `Vous êtes un expert en messages de commit. ${MESSAGE_STYLES[style].description} Suivez le format Conventional Commits avec ces préfixes:${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "Générez un message de commit pour le diff Git suivant :"
    },
    german: {
        name: 'Deutsch',
        systemPrompt: (style) => `Sie sind ein Commit-Message-Experte. ${MESSAGE_STYLES[style].description} Folgen Sie dem Conventional-Commits-Format mit diesen Präfixen:${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "Generieren Sie eine Commit-Nachricht für den folgenden Git-Diff:"
    },
    italian: {
        name: 'Italiano',
        systemPrompt: (style) => `Sei un esperto di messaggi di commit. ${MESSAGE_STYLES[style].description} Segui il formato Conventional Commits con questi prefissi:${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "Genera un messaggio di commit per il seguente diff Git:"
    },
    japanese: {
        name: '日本語',
        systemPrompt: (style) => `あなたはコミットメッセージを生成する専門家です。${
            style === 'simple' ? '変更の本質のみを簡潔に説明してください。' :
            style === 'normal' ? '変更内容を適度な詳しさで説明してください。' :
            '変更の文脈、理由、影響を含めて詳しく説明してください。'
        }以下のプレフィックスを使用してConventional Commits形式に従ってください：${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "以下のGit diffに対するコミットメッセージを生成してください："
    },
    chinese: {
        name: '中文',
        systemPrompt: (style) => `您是提交消息专家。${MESSAGE_STYLES[style].description} 请按照Conventional Commits格式使用以下前缀：${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "为以下Git差异生成提交消息："
    },
    korean: {
        name: '한국어',
        systemPrompt: (style) => `당신은 커밋 메시지 전문가입니다. ${MESSAGE_STYLES[style].description} Conventional Commits 형식과 다음 접두사를 사용하세요:${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "다음 Git diff에 대한 커밋 메시지를 생성하세요:"
    },
    vietnamese: {
        name: 'Tiếng Việt',
        systemPrompt: (style) => `Bạn là chuyên gia về tin nhắn commit. ${MESSAGE_STYLES[style].description} Sử dụng định dạng Conventional Commits với các tiền tố sau:${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "Tạo tin nhắn commit cho Git diff sau:"
    },
    russian: {
        name: 'Русский',
        systemPrompt: (style) => `Вы эксперт по сообщениям коммитов. ${MESSAGE_STYLES[style].description} Используйте формат Conventional Commits с этими префиксами:${COMMIT_PREFIX_GUIDE}`,
        diffMessage: "Сгенерируйте сообщение коммита для следующего Git diff:"
    }
};

async function showSettingsPrompt(): Promise<boolean> {
    const response = await vscode.window.showWarningMessage(
        'OpenAI API key is not configured. Would you like to configure it now?',
        'Yes',
        'No'
    );

    if (response === 'Yes') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'scmComitter.openaiApiKey');
        return true;
    }
    return false;
}

async function generateCommitMessageWithAI(diff: string): Promise<string> {
    const config = vscode.workspace.getConfiguration('scmComitter');
    const apiKey = config.get<string>('openaiApiKey');
    const language = config.get<string>('language') || 'japanese';
    const messageStyle = config.get<MessageStyle>('messageStyle') || 'normal';

    if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
    }

    const languageConfig = LANGUAGE_CONFIGS[language];

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'chatgpt-4o-latest',  // Updated to latest model
                messages: [
                    {
                        role: 'system',
                        content: languageConfig.systemPrompt(messageStyle)
                    },
                    {
                        role: 'user',
                        content: `${languageConfig.diffMessage}\n\n${diff}`
                    }
                ],
                temperature: 0.2,
                max_tokens: MESSAGE_STYLES[messageStyle].tokens
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`OpenAI API error: ${error.response?.data.error.message || error.message}`);
        }
        throw error;
    }
}

async function stageAllChanges(repository: Repository): Promise<void> {
    const changes = repository.state.workingTreeChanges.map(change => change);
    if (changes.length > 0) {
        await repository.add(changes);
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "vscode-scm-comitter" is now active!');

    // Git拡張機能を取得
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
    if (!gitExtension) {
        vscode.window.showErrorMessage('Git extension not found');
        return;
    }

    const git = gitExtension.getAPI(1);
    
    // Git リポジトリの監視を開始
    git.onDidChangeState(() => {
        // リポジトリが追加されたときに設定を適用
        for (const repo of git.repositories) {
            setupRepository(repo);
        }
    });

    // 既存のリポジトリに設定を適用
    git.repositories.forEach(repo => {
        setupRepository(repo);
    });

    // 設定画面を開くコマンド
    const openSettingsDisposable = vscode.commands.registerCommand('vscode-scm-comitter.openSettings', async () => {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'scmComitter');
    });

    // コミットメッセージの生成機能
    const generateDisposable = vscode.commands.registerCommand('vscode-scm-comitter.generateMessage', async () => {
        const repository = git.repositories[0];
        if (!repository) {
            vscode.window.showErrorMessage('No Git repository found');
            return;
        }

        const config = vscode.workspace.getConfiguration('scmComitter');
        const apiKey = config.get<string>('openaiApiKey');
        const messageStyle = config.get<MessageStyle>('messageStyle') || 'normal';

        if (!apiKey) {
            const shouldContinue = await showSettingsPrompt();
            if (!shouldContinue) {
                return;
            }
            // 設定画面を表示した後、ユーザーが設定を行うまで待機
            await new Promise(resolve => setTimeout(resolve, 1000));
            // 設定を再取得
            if (!config.get<string>('openaiApiKey')) {
                return;
            }
        }

        // プログレスバーを表示
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Generating ${messageStyle} commit message...`,
            cancellable: false
        }, async () => {
            try {
                // ステージングされた変更の差分を取得
                let diff = await repository.diff(true);
                
                // ステージングされた変更がない場合、未ステージの変更を自動的にステージング
                if (!diff) {
                    await stageAllChanges(repository);
                    diff = await repository.diff(true);
                    
                    if (!diff) {
                        vscode.window.showWarningMessage('No changes to commit');
                        return;
                    } else {
                        vscode.window.showInformationMessage('Changes have been automatically staged');
                    }
                }

                // OpenAI APIを使用してコミットメッセージを生成
                const message = await generateCommitMessageWithAI(diff);
                repository.inputBox.value = message;

            } catch (error) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(`Error: ${error.message}`);
                } else {
                    vscode.window.showErrorMessage('Failed to generate commit message');
                }
            }
        });
    });

    context.subscriptions.push(generateDisposable, openSettingsDisposable);
}

function setupRepository(repository: Repository) {
    // プレースホルダーテキストを設定
    repository.inputBox.placeholder = COMMIT_PREFIX_GUIDE;
}

export function deactivate() {}
