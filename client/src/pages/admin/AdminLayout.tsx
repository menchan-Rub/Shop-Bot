import React, { ReactNode } from 'react';
import { Box, Container, Text, Button, VStack, Center, Spinner } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../components/admin/AdminLayout';

interface AdminPageLayoutProps {
  children: ReactNode;
}

// 管理者コンテンツをラップするためのコンポーネント
export default function AdminPageLayout({ children }: AdminPageLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // セッションが読み込み中の場合はまだアクセス判定をしない
    if (status === 'loading') return;

    // セッションやローカルストレージのチェックは副作用内で安全に行う
    const checkAccess = () => {
      try {
        // セッションからの管理者権限の確認
        const isAdminBySession = session?.user?.isAdmin || session?.user?.role === 'admin';
        
        // ローカルストレージからの確認（クライアントサイドでのみ動作）
        let adminToken = null;
        if (typeof window !== 'undefined') {
          adminToken = localStorage.getItem('adminToken');
        }
        
        // トークンの存在とその長さで判定（AdminGuardと同じロジックに統一）
        const hasAdminToken = !!adminToken && adminToken.length > 10;

        console.log('AdminPageLayout - 権限チェック:', { 
          isAdminBySession, 
          hasAdminToken, 
          adminToken,
          sessionData: session?.user,
          currentPath: router.pathname
        });

        // いずれかの方法で管理者権限があれば許可
        if (isAdminBySession || hasAdminToken) {
          console.log('管理者権限あり - アクセス許可');
          setIsAuthorized(true);
        } else {
          console.log('管理者権限なし - アクセス拒否');
          setIsAuthorized(false);
          // 管理者権限がない場合、ログインページにリダイレクト
          if (router.pathname !== '/admin/login') {
            router.push('/admin/login?error=unauthorized');
          }
        }
      } catch (error) {
        console.error('権限チェックエラー:', error);
        setIsAuthorized(false);
        // エラーが発生した場合も、ログインページにリダイレクト
        router.push('/admin/login?error=server');
      } finally {
        setLoading(false);
      }
    };

    // 権限チェックを実行
    checkAccess();
  }, [session, status, router]);

  // セッションがロード中の場合はローディングスピナーを表示
  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <Center h="calc(100vh - 100px)" w="full">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>管理者権限を確認中...</Text>
          </VStack>
        </Center>
      </AdminLayout>
    );
  }

  // 未認証または管理者権限がない場合、アクセス拒否メッセージを表示
  if (!isAuthorized && router.pathname !== '/admin/login') {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">アクセス権限がありません</Text>
            <Text>このページにアクセスするには管理者権限が必要です</Text>
            <Button colorScheme="blue" onClick={() => router.push('/admin/login')}>
              ログインページへ戻る
            </Button>
          </VStack>
        </Container>
      </AdminLayout>
    );
  }

  // 管理者権限が確認できた場合は子コンポーネントを表示
  return <AdminLayout>{children}</AdminLayout>;
} 