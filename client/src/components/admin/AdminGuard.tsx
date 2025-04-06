import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuardコンポーネント
 * 管理者権限を持つユーザーのみアクセスを許可する
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdminAccess = () => {
      // セッション認証での確認
      const isAdminBySession = session?.user?.isAdmin || session?.user?.role === 'admin';
      
      // トークン認証での確認 (localStorage)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      // トークンの長さによる制限を削除し、存在するだけで有効とみなす
      const hasAdminToken = !!adminToken;
      
      console.log('AdminGuard - 権限チェック:', { 
        isAdminBySession, 
        hasAdminToken, 
        adminToken: adminToken ? `${adminToken.substring(0, 20)}...` : null,
        currentPath: router.pathname
      });
      
      // どちらかの方法で管理者権限があればアクセスを許可
      setIsAuthorized(isAdminBySession || hasAdminToken);
      setIsCheckingAuth(false);
      
      // 権限がない場合はログインページにリダイレクト
      if (!isAdminBySession && !hasAdminToken) {
        console.log('AdminGuard - 認証失敗: ログインページへリダイレクト');
        router.push('/admin/login?error=unauthorized');
      }
    };
    
    if (status === 'loading') {
      // セッション読み込み中
      return;
    }
    
    checkAdminAccess();
  }, [session, status, router]);

  // 認証チェック中の表示
  if (isCheckingAuth) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>権限を確認中...</Text>
        </VStack>
      </Center>
    );
  }

  // 認証成功の場合、子コンポーネントを表示
  return isAuthorized ? <>{children}</> : null;
}

// デフォルトエクスポート (後方互換性のため)
export default AdminGuard; 