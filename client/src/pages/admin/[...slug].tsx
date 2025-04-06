import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Heading, Text, VStack, Spinner, Center, Button } from '@chakra-ui/react';
import AdminLayout from '../../components/admin/AdminLayout';

// 各ページコンポーネントを動的にインポート
import dynamic from 'next/dynamic';

// 商品管理ページ
const ProductsPage = dynamic(() => import('./products/index').then(mod => ({ 
  default: mod.default || mod 
})), {
  loading: () => <LoadingComponent title="商品管理" />
});

// カテゴリー管理ページ
const CategoriesPage = dynamic(() => import('./categories').then(mod => ({ 
  default: mod.default || mod 
})), {
  loading: () => <LoadingComponent title="カテゴリー管理" />
});

// ユーザー管理ページ
const UsersPage = dynamic(() => import('./users').then(mod => ({ 
  default: mod.default || mod 
})), {
  loading: () => <LoadingComponent title="ユーザー管理" />
});

// 注文管理ページ
const OrdersPage = dynamic(() => import('./orders/index').then(mod => ({ 
  default: mod.default || mod 
})), {
  loading: () => <LoadingComponent title="注文管理" />
});

// 設定ページ
const SettingsPage = dynamic(() => import('./settings').then(mod => ({ 
  default: mod.default || mod 
})), {
  loading: () => <LoadingComponent title="設定" />
});

// ログページ
const LogsPage = dynamic(() => import('./logs').then(mod => ({ 
  default: mod.default || mod 
})), {
  loading: () => <LoadingComponent title="ログ" />
});

// バックアップページ
const BackupPage = dynamic(() => import('./backup').then(mod => ({ 
  default: mod.default || mod 
})), {
  loading: () => <LoadingComponent title="バックアップ" />
});

// ローディングコンポーネント
function LoadingComponent({ title }: { title: string }) {
  return (
    <Center h="50vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="cyan.500" thickness="4px" />
        <Text fontSize="lg">{title}を読み込み中...</Text>
      </VStack>
    </Center>
  );
}

// エラーページコンポーネント
function ErrorComponent({ message }: { message: string }) {
  const router = useRouter();
  
  return (
    <AdminLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6} textAlign="center">
          <Heading>ページが見つかりません</Heading>
          <Text>{message}</Text>
          <Button colorScheme="blue" onClick={() => router.push('/admin')}>
            ダッシュボードへ戻る
          </Button>
        </VStack>
      </Container>
    </AdminLayout>
  );
}

// メインのAdminページコンポーネント
export default function AdminSlugPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [Page, setPage] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    
    // ルートパスの決定
    const path = Array.isArray(slug) ? slug[0] : slug;
    
    // /admin の場合はリダイレクト
    if (!path) {
      router.replace('/admin');
      return;
    }

    // パスに基づいて適切なコンポーネントを設定
    switch (path) {
      case 'products':
        setPage(() => ProductsPage);
        break;
      case 'categories':
        setPage(() => CategoriesPage);
        break;
      case 'users':
        setPage(() => UsersPage);
        break;
      case 'orders':
        setPage(() => OrdersPage);
        break;
      case 'settings':
        setPage(() => SettingsPage);
        break;
      case 'logs':
        setPage(() => LogsPage);
        break;
      case 'backup':
        setPage(() => BackupPage);
        break;
      default:
        setError(`指定されたページ '${path}' は見つかりませんでした。`);
        setPage(null);
    }
  }, [slug, router.isReady]);

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (!Page) {
    return (
      <AdminLayout>
        <LoadingComponent title="管理者ページ" />
      </AdminLayout>
    );
  }

  return <Page />;
} 