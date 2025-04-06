import React, { useEffect, useState } from 'react';
import { Container, Box, Heading, Text, Spinner, VStack } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

export default function PrivacyPage() {
  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    // プライバシーポリシーのマークダウンコンテンツ
    const privacyContent = `
# プライバシーポリシー

**最終更新日: 2025年4月1日**

## 1. はじめに

Discord Shop（以下「当社」、「当サービス」）は、お客様のプライバシーを尊重し、個人情報の保護に努めています。
このプライバシーポリシーでは、当サービス利用時に収集される情報とその利用方法について説明します。

## 2. 収集する情報

当社は以下の情報を収集することがあります：

### 2.1 ユーザーが提供する情報
- Discord認証を通じて取得する情報（ユーザー名、メールアドレス、プロフィール画像など）
- 商品の購入・販売に関する情報
- カスタマーサポートに提供された情報

### 2.2 自動的に収集される情報
- 利用状況データ（アクセスしたページ、クリックした機能など）
- デバイス情報（IPアドレス、ブラウザの種類、言語設定など）
- Cookieやその他の追跡技術によって収集される情報

## 3. 情報の利用目的

収集した情報は以下の目的で利用されます：

- サービスの提供と維持
- ユーザーアカウントの作成と管理
- 商品の販売・購入処理
- カスタマーサポートの提供
- サービスの改善と新機能の開発
- 不正行為の防止と検出
- 法的義務の遵守

## 4. 情報の共有

当社は、以下の場合を除き、ユーザーの個人情報を第三者と共有しません：

- ユーザーの同意がある場合
- サービス提供に必要なパートナー企業との共有
- 法的要請に応じる必要がある場合
- 当社の権利、財産、安全を保護する必要がある場合

## 5. データの保護

当社は、収集した情報を保護するために適切な技術的・組織的措置を講じています。
ただし、インターネット上でのデータ転送や電子ストレージは100%安全ではないことをご了承ください。

## 6. ユーザーの権利

ユーザーには以下の権利があります：

- 個人情報へのアクセスと修正
- 個人情報の削除（特定の条件下）
- データ処理の制限
- データポータビリティ

これらの権利を行使するには、下記の連絡先までご連絡ください。

## 7. Cookieの使用

当サービスでは、ユーザーエクスペリエンスの向上のためにCookieを使用しています。
ブラウザの設定によりCookieの使用を制限または無効化することができますが、
一部の機能が正常に動作しなくなる可能性があります。

## 8. 変更

当社は、このプライバシーポリシーを随時更新することがあります。
重要な変更がある場合は、当サービス上で通知します。

## 9. 連絡先

プライバシーに関するご質問やご懸念がある場合は、以下の連絡先までご連絡ください：

privacy@discord-shop.example.com

---

© 2025 Discord Shop. All rights reserved.
    `;

    setMarkdown(privacyContent);
    setLoading(false);
  }, []);

  return (
    <Container maxW="container.lg" py={8}>
      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <VStack spacing={6} align="stretch">
          <Box className="markdown">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </Box>
        </VStack>
      )}
    </Container>
  );
} 