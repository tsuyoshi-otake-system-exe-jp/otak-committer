import { PromptType } from '../types/language';

export const getJapanesePrompt = (type: PromptType): string => {
    const prompts: Record<PromptType, string> = {
        system: `
あなたは経験豊富なソフトウェアエンジニアで、プロジェクトのコミットメッセージやPRの作成を支援します。
以下のような特徴を持つ出力を行います：

- 簡潔で分かりやすい日本語
- 技術的に正確な表現
- 変更内容を適切に要約
`,
        commit: `
提供された差分に基づいて、{{style}}スタイルのコミットメッセージを生成してください。

スタイルの説明：
- normal: 通常の技術的な文体
- emoji: 絵文字を含む親しみやすい文体
- kawaii: かわいらしい口調で親しみやすい文体

差分：
{{diff}}
`,
        prTitle: `
以下の差分に基づいて、Pull Requestのタイトルを生成してください。

注意点：
1. タイトルは簡潔で変更内容を適切に表現すること
2. 日本語で書くこと
3. プレフィックスをつけること（例：「機能追加:」「バグ修正:」「改善:」など）

差分：
{{diff}}
`,
        prBody: `
以下の差分に基づいて、レビューしやすいPull Requestの説明文を生成してください。

# 変更概要
- 実装した機能や修正の簡潔な説明
- 変更の目的や背景
- 技術的なアプローチの説明

# 重要なレビューポイント
- レビュワーに特に確認してほしい箇所
- 設計上の重要な決定事項
- 性能や保守性に関する考慮点

# 変更内容の詳細
- 主要な変更点の説明
- 影響を受けるコンポーネントや機能
- 依存関係の変更（ある場合）

# 注意事項
- デプロイ時の注意点
- 既存機能への影響
- 追加で必要な設定や環境変数

差分：
{{diff}}
`
    };

    return prompts[type] || '';
};