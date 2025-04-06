import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  useToast,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  useDisclosure,
  IconButton,
  Tooltip,
  SimpleGrid
} from '@chakra-ui/react';
import { FiEdit, FiEye, FiEyeOff, FiTrash2, FiPlus, FiFolder } from 'react-icons/fi';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FaFolder } from 'react-icons/fa';
import AdminCard from '../../components/admin/AdminCard';

// カテゴリー型定義
interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isVisible: boolean;
  emoji: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const toast = useToast();
  const { data: session, status } = useSession();
  
  // すべてのHooksをコンポーネントのトップレベルで呼び出す
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 権限チェック（変数のみここで定義）
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const hasAdminPermission = session?.user?.isAdmin || adminToken;

  // カテゴリー一覧を取得
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('カテゴリー一覧の取得に失敗しました');
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('カテゴリー取得エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'カテゴリー一覧の取得に失敗しました。デモデータを表示します。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // デモデータをセット
      setCategories([
        {
          _id: 'cat1',
          name: 'ゲーミングデバイス',
          slug: 'gaming-devices',
          description: 'ゲーミングマウス、キーボード、ヘッドセットなどの周辺機器',
          displayOrder: 1,
          isVisible: true,
          emoji: '🎮'
        },
        {
          _id: 'cat2',
          name: 'デジタルコンテンツ',
          slug: 'digital-content',
          description: 'Discord Nitro、ゲーム内アイテム、デジタルサービス',
          displayOrder: 2,
          isVisible: true,
          emoji: '💻'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 初回読み込み時にカテゴリー一覧を取得
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // カテゴリーの表示/非表示を切り替え
  const toggleVisibility = useCallback((id: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat._id === id ? { ...cat, isVisible: !cat.isVisible } : cat
      )
    );
    
    // 実際のAPIでは更新処理を実装
    toast({
      title: '表示状態を変更しました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  // カテゴリーの削除
  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat._id !== id));
    
    // 実際のAPIでは削除処理を実装
    toast({
      title: 'カテゴリーを削除しました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  // 新しいカテゴリーを追加（デモ）
  const addCategory = useCallback(() => {
    const newCategory: Category = {
      _id: `cat${Date.now()}`,
      name: '新しいカテゴリー',
      slug: 'new-category',
      description: 'カテゴリーの説明をここに入力',
      displayOrder: categories.length + 1,
      isVisible: true,
      emoji: '🆕'
    };
    
    setCategories(prev => [...prev, newCategory]);
    
    toast({
      title: '新しいカテゴリーを追加しました',
      description: '実際の環境ではフォームから入力を受け付けます',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }, [categories.length, toast]);

  if (!hasAdminPermission && status === 'authenticated') {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="center">
          <Heading size="lg">アクセス権限がありません</Heading>
          <Text>このページにアクセスする権限がありません。管理者としてログインしてください。</Text>
          <Button colorScheme="cyan" onClick={() => router.push('/admin/login')}>
            管理者ログインページへ
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <AdminLayout>
      <Box p={5}>
        <AdminCard
          title="カテゴリー管理"
          description="商品カテゴリーの一覧を表示・管理します"
          icon={FiFolder}
          action={
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={addCategory}
            >
              新規カテゴリー
            </Button>
          }
        >
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th>カテゴリー名</Th>
                <Th>Slug</Th>
                <Th>説明</Th>
                <Th>表示順</Th>
                <Th>状態</Th>
                <Th>操作</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((category) => (
                <Tr key={category._id}>
                  <Td>
                    <HStack>
                      <Text fontSize="lg">{category.emoji}</Text>
                      <Text fontWeight="medium">{category.name}</Text>
                    </HStack>
                  </Td>
                  <Td>{category.slug}</Td>
                  <Td>
                    <Text noOfLines={1} maxW="250px">
                      {category.description || '-'}
                    </Text>
                  </Td>
                  <Td>{category.displayOrder}</Td>
                  <Td>
                    <Badge
                      colorScheme={category.isVisible ? 'green' : 'gray'}
                      variant="solid"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {category.isVisible ? '表示' : '非表示'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Tooltip label="編集">
                        <IconButton
                          aria-label="カテゴリーを編集"
                          icon={<FiEdit />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                        />
                      </Tooltip>
                      <Tooltip label={category.isVisible ? '非表示にする' : '表示する'}>
                        <IconButton
                          aria-label="表示状態を切り替え"
                          icon={category.isVisible ? <FiEyeOff /> : <FiEye />}
                          size="sm"
                          colorScheme={category.isVisible ? 'gray' : 'green'}
                          variant="ghost"
                          onClick={() => toggleVisibility(category._id)}
                        />
                      </Tooltip>
                      <Tooltip label="削除">
                        <IconButton
                          aria-label="カテゴリーを削除"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => deleteCategory(category._id)}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
              {categories.length === 0 && (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={10}>
                    <Text color="gray.500">カテゴリーがありません。追加してください。</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </AdminCard>
      </Box>
    </AdminLayout>
  );
};

export default CategoriesPage; 