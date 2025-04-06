import React from "react";
import { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack, HStack,
  Table, Thead, Tbody, Tr, Th, Td, Input, FormControl,
  FormLabel, useToast, IconButton, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, useDisclosure, useColorModeValue,
  AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  Badge, Switch, Select, Flex, Icon, Menu, MenuButton, MenuList,
  MenuItem, Checkbox, Drawer, DrawerBody, DrawerCloseButton,
  DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  Accordion, AccordionItem, AccordionButton, AccordionPanel,
  AccordionIcon, Progress, Spinner
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaPlus, FaArrowRight, FaFolder, FaFolderOpen, 
         FaEye, FaEyeSlash, FaArrowUp, FaArrowDown, FaChevronDown,
         FaBars, FaExchangeAlt, FaCheck } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';

type Category = {
  _id: string;
  name: string;
  description: string;
  slug: string;
  active: boolean;
  emoji: string;
  displayOrder: number;
  isVisible: boolean;
  parentId?: string;  // 親カテゴリーID
  children?: Category[]; // 子カテゴリー
};

function CategoriesPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isAlertOpen, 
    onOpen: onAlertOpen, 
    onClose: onAlertClose 
  } = useDisclosure();
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '📦',
    displayOrder: 0,
    isVisible: true,
    parentId: ''  // 親カテゴリーID
  });
  const [hierarchicalCategories, setHierarchicalCategories] = useState<Category[]>([]);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cancelRef = useRef(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { 
    isOpen: isBulkVisibilityOpen, 
    onOpen: onBulkVisibilityOpen, 
    onClose: onBulkVisibilityClose 
  } = useDisclosure();
  const { 
    isOpen: isDrawerOpen, 
    onOpen: onDrawerOpen, 
    onClose: onDrawerClose 
  } = useDisclosure();
  const [bulkVisibility, setBulkVisibility] = useState<boolean>(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    // 管理者権限チェック
    const checkAdminAccess = () => {
      // セッションの確認
      const isAdminBySession = session?.user?.isAdmin || session?.user?.role === 'admin';
      
      // ローカルストレージの確認
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const hasAdminToken = !!adminToken && adminToken.length > 10;
      
      // いずれかの方法で管理者と確認できれば許可
      return isAdminBySession || hasAdminToken;
    };
    
    const isAdmin = checkAdminAccess();
    setHasAdminAccess(isAdmin);
    
    if (isAdmin) {
      fetchCategories();
    }
  }, [session]);

  useEffect(() => {
    // クッキーを含めるようにaxiosを設定
    axios.defaults.withCredentials = true;
    
    if (session?.user?.isAdmin) {
      fetchCategories();
    } else if (status === 'authenticated') {
      router.replace('/');
      toast({
        title: "アクセス権限がありません",
        description: "管理者ページにアクセスする権限がありません",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else {
      setLoading(false);
    }
  }, [session, status]);

  // カテゴリーを階層構造に変換する
  useEffect(() => {
    if (categories.length > 0) {
      const hierarchical = buildCategoryHierarchy(categories);
      setHierarchicalCategories(hierarchical);
    }
  }, [categories]);

  // カテゴリーの階層構造を構築
  const buildCategoryHierarchy = (flatCategories: Category[]): Category[] => {
    // 親子関係のマップを作成
    const categoryMap: Record<string, Category> = {};
    flatCategories.forEach(category => {
      categoryMap[category._id] = { ...category, children: [] };
    });
    
    // 親子関係を構築
    const rootCategories: Category[] = [];
    flatCategories.forEach(category => {
      if (category.parentId && categoryMap[category.parentId]) {
        // 親カテゴリーが存在する場合、その子として追加
        categoryMap[category.parentId].children.push(categoryMap[category._id]);
      } else {
        // 親がない、または親が存在しない場合はルートカテゴリーとして扱う
        rootCategories.push(categoryMap[category._id]);
      }
    });
    
    // 表示順でソート
    return rootCategories.sort((a, b) => a.displayOrder - b.displayOrder);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // 認証付きAPIクライアントを使用
      const response = await getWithAuth('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('カテゴリー取得エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'カテゴリーの取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setFormData({
      name: '',
      description: '',
      emoji: '📦',
      displayOrder: 0,
      isVisible: true,
      parentId: ''
    });
    onOpen();
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      emoji: category.emoji || '📦',
      displayOrder: category.displayOrder || 0,
      isVisible: category.isVisible,
      parentId: category.parentId || ''
    });
    onOpen();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      name: value,
      // 名前が変更されたらスラグも自動生成
      slug: generateSlug(value)
    });
  };

  const saveCategory = async () => {
    try {
      if (!formData.name) {
        toast({
          title: '入力エラー',
          description: 'カテゴリー名は必須です',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // 循環参照チェック（自分自身を親に設定しようとしている場合）
      if (currentCategory && formData.parentId === currentCategory._id) {
        toast({
          title: '入力エラー',
          description: 'カテゴリーを自分自身の親に設定することはできません',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // 循環参照チェック（子カテゴリーを親に設定しようとしている場合）
      if (currentCategory && formData.parentId && isChildCategory(formData.parentId, currentCategory._id)) {
        toast({
          title: '入力エラー',
          description: '子カテゴリーを親カテゴリーに設定することはできません',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (currentCategory) {
        // 既存カテゴリーの更新
        await putWithAuth(`/api/categories/${currentCategory._id}`, formData);
        toast({
          title: '更新完了',
          description: 'カテゴリーが更新されました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // 新規カテゴリーの作成
        await postWithAuth('/api/categories', formData);
        toast({
          title: '作成完了',
          description: '新しいカテゴリーが作成されました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      // 最新のカテゴリーを再取得
      fetchCategories();
      onClose();
    } catch (error) {
      console.error('カテゴリー保存エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: error.response?.data?.error || 'カテゴリーの保存に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 指定されたカテゴリーがpotentialParentIdの子カテゴリーかどうかをチェック
  const isChildCategory = (potentialParentId: string, categoryId: string): boolean => {
    // 現在のカテゴリーの子カテゴリーを再帰的に検索
    const findInChildren = (parentId: string): boolean => {
      const parent = categories.find(c => c._id === parentId);
      if (!parent) return false;
      
      // この階層の子カテゴリーを検索
      const childrenOfParent = categories.filter(c => c.parentId === parentId);
      
      // 子カテゴリーに対象のカテゴリーが含まれているかチェック
      for (const child of childrenOfParent) {
        if (child._id === categoryId) return true;
        // 子カテゴリーの子をさらに検索
        if (findInChildren(child._id)) return true;
      }
      
      return false;
    };
    
    return findInChildren(potentialParentId);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    onAlertOpen();
  };

  const handleDeleteCategory = async () => {
    try {
      if (!categoryToDelete) return;
      
      await deleteWithAuth(`/api/categories/${categoryToDelete._id}`);
      
      toast({
        title: '削除完了',
        description: 'カテゴリーが削除されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 最新のカテゴリーを再取得
      fetchCategories();
    } catch (error) {
      console.error('カテゴリー削除エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: error.response?.data?.error || 'カテゴリーの削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onAlertClose();
    }
  };

  // 全選択の切り替え
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      // 現在表示されている全カテゴリーを選択
      setSelectedCategories(categories.map(cat => cat._id));
    } else {
      // 選択解除
      setSelectedCategories([]);
    }
  };

  // 個別選択の切り替え
  const handleSelectCategory = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    const checked = e.target.checked;
    
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  // 一括表示/非表示切り替え
  const handleBulkVisibilityChange = async () => {
    if (selectedCategories.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      // 一括でステータス変更APIを呼び出す
      await axios.post('/api/categories/bulk-update', {
        categoryIds: selectedCategories,
        update: { isVisible: bulkVisibility }
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: '一括更新完了',
        description: `${selectedCategories.length}件のカテゴリーを${bulkVisibility ? '表示' : '非表示'}に設定しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 一覧を再取得
      fetchCategories();
      // モーダルを閉じる
      onBulkVisibilityClose();
    } catch (error) {
      console.error('一括表示/非表示更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'カテゴリーの一括更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ドラッグ&ドロップ開始
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // ドラッグ&ドロップ終了
  const handleDragEnd = async (result) => {
    setIsDragging(false);
    
    // ドロップ先がない場合や同じ位置の場合は何もしない
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }
    
    // カテゴリーの順序を変更
    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(result.source.index, 1);
    newCategories.splice(result.destination.index, 0, movedCategory);
    
    // 表示順を更新
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      displayOrder: index
    }));
    
    // 状態を更新
    setCategories(updatedCategories);
    
    // バックエンドに保存
    try {
      setSavingOrder(true);
      
      // 順序付けデータを生成
      const orderData = updatedCategories.map((cat, index) => ({
        id: cat._id,
        displayOrder: index
      }));
      
      // APIリクエスト
      await axios.post('/api/categories/reorder', {
        categories: orderData
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: '順序を保存しました',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('カテゴリー順序更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '順序の保存に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // エラーの場合は元の状態に戻す
      fetchCategories();
    } finally {
      setSavingOrder(false);
    }
  };

  // ツリービューでの順序変更
  const handleCategoryUp = async (categoryId: string) => {
    const catIndex = categories.findIndex(cat => cat._id === categoryId);
    if (catIndex <= 0) return; // 既に先頭なら何もしない
    
    const newCategories = [...categories];
    [newCategories[catIndex - 1], newCategories[catIndex]] = [newCategories[catIndex], newCategories[catIndex - 1]];
    
    // 表示順を更新
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      displayOrder: index
    }));
    
    // 状態を更新
    setCategories(updatedCategories);
    
    // バックエンドに保存
    try {
      const orderData = updatedCategories.map((cat, index) => ({
        id: cat._id,
        displayOrder: index
      }));
      
      await axios.post('/api/categories/reorder', {
        categories: orderData
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: 'カテゴリーを上に移動しました',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('カテゴリー順序更新エラー:', error);
      fetchCategories(); // エラーの場合は元に戻す
    }
  };

  const handleCategoryDown = async (categoryId: string) => {
    const catIndex = categories.findIndex(cat => cat._id === categoryId);
    if (catIndex >= categories.length - 1) return; // 既に最後なら何もしない
    
    const newCategories = [...categories];
    [newCategories[catIndex], newCategories[catIndex + 1]] = [newCategories[catIndex + 1], newCategories[catIndex]];
    
    // 表示順を更新
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      displayOrder: index
    }));
    
    // 状態を更新
    setCategories(updatedCategories);
    
    // バックエンドに保存
    try {
      const orderData = updatedCategories.map((cat, index) => ({
        id: cat._id,
        displayOrder: index
      }));
      
      await axios.post('/api/categories/reorder', {
        categories: orderData
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: 'カテゴリーを下に移動しました',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('カテゴリー順序更新エラー:', error);
      fetchCategories(); // エラーの場合は元に戻す
    }
  };

  // カテゴリーツリーの再帰的レンダリング
  const renderCategoryTree = (cats: Category[], depth = 0) => {
    return cats.map((category) => (<React.Fragment key={category._id}>
      <>
        <Tr key={category._id} bg={depth > 0 ? (useColorModeValue(`gray.50`, `gray.700`)) : ''}>
          <Td pl={`${depth * 2 + 4}rem`}>
            <Flex align="center">
              <Icon 
                as={category.children?.length ? FaFolderOpen : FaFolder} 
                color={category.children?.length ? "yellow.500" : "blue.500"} 
                mr={2} 
              />
              <Text fontWeight={depth === 0 ? "bold" : "normal"}>
                {category.emoji} {category.name}
              </Text>
            </Flex>
          </Td>
          <Td>{category.slug}</Td>
          <Td isNumeric>{category.displayOrder}</Td>
          <Td>
            <Badge colorScheme={category.isVisible ? 'green' : 'red'}>
              {category.isVisible ? '表示' : '非表示'}
            </Badge>
          </Td>
          <Td>
            <HStack spacing={2}>
              <IconButton
                aria-label="Edit Category"
                icon={<FaEdit />}
                size="sm"
                colorScheme="blue"
                onClick={() => handleEditCategory(category)}
              />
              <IconButton
                aria-label="Delete Category"
                icon={<FaTrash />}
                size="sm"
                colorScheme="red"
                onClick={() => handleDeleteClick(category)}
              />
            </HStack>
          </Td>
        </Tr>
        {/* 子カテゴリーを再帰的にレンダリング */}
        {category.children && category.children.length > 0 && 
          renderCategoryTree(category.children, depth + 1)
        }
      );}</React.Fragment>
    ));
  };

  // カテゴリーツリーをアコーディオン形式でレンダリング
  const renderCategoryTreeAccordion = (categories, depth = 0) => {
    return categories.map(category => (
      <AccordionItem key={category._id} border={0} mb={1}>
        <Box ml={depth * 4}>
          <AccordionButton 
            py={2} 
            px={3}
            _hover={{ bg: 'gray.100' }}
            borderRadius="md"
          >
            <Box flex="1" textAlign="left">
              <Flex align="center">
                <Icon 
                  as={category.children?.length ? FaFolderOpen : FaFolder} 
                  color={category.children?.length ? "yellow.500" : "blue.500"} 
                  mr={2} 
                />
                <Text fontWeight={depth === 0 ? "medium" : "normal"}>
                  {category.emoji} {category.name}
                </Text>
                {!category.isVisible && (
                  <Badge ml={2} colorScheme="red" variant="subtle">
                    非表示
                  </Badge>
                )}
              </Flex>
            </Box>
            {category.children?.length > 0 && <AccordionIcon />}
          </AccordionButton>
        </Box>
        
        {category.children?.length > 0 && (
          <AccordionPanel pb={0} pt={1}>
            {renderCategoryTreeAccordion(category.children, depth + 1)}
          </AccordionPanel>
        )}
      </AccordionItem>
    ));
  };

  // 個別カテゴリーの可視性を切り替え
  const handleVisibilityToggle = async (category) => {
    try {
      await putWithAuth(`/api/categories/${category._id}`, {
        ...category,
        isVisible: !category.isVisible
      });
      
      fetchCategories();
      
      toast({
        title: `カテゴリーを${!category.isVisible ? '表示' : '非表示'}にしました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('カテゴリー表示切替エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '表示状態の変更に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
            <Text mt={4}>カテゴリーデータを読み込み中...</Text>
          </VStack>
        </Container>
      </AdminLayout>
    );
  }

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const hasAdminPermission = session?.user?.isAdmin || adminToken;

  if (!hasAdminPermission) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading>アクセス権限がありません</Heading>
          <Text>このページにアクセスするには管理者権限が必要です</Text>
          <Button 
            colorScheme="cyan"
            onClick={() => window.location.href = '/'}
          >
            トップページへ戻る
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading as="h1" size="xl" mb={2}>カテゴリー管理</Heading>
          <Text color="gray.600">カテゴリーの追加、編集、並び替え</Text>
        </Box>

        <Flex justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <HStack>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={handleAddCategory}
            >
              新規カテゴリー
            </Button>
            <Button
              leftIcon={<FaBars />}
              variant="outline"
              onClick={onDrawerOpen}
            >
              ツリービュー
            </Button>
          </HStack>

          <HStack>
            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<FaChevronDown />}
                isDisabled={selectedCategories.length === 0}
              >
                一括操作 ({selectedCategories.length})
              </MenuButton>
              <MenuList>
                <MenuItem 
                  icon={<FaEye />} 
                  onClick={() => {
                    setBulkVisibility(true);
                    onBulkVisibilityOpen();
                  }}
                  isDisabled={selectedCategories.length === 0}
                >
                  一括表示
                </MenuItem>
                <MenuItem 
                  icon={<FaEyeSlash />} 
                  onClick={() => {
                    setBulkVisibility(false);
                    onBulkVisibilityOpen();
                  }}
                  isDisabled={selectedCategories.length === 0}
                >
                  一括非表示
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {loading ? (
          <Text>読み込み中...</Text>
        ) : (
          <>
            {savingOrder && (
              <Box mb={4}>
                <Text mb={2}>順序を保存中...</Text>
                <Progress size="xs" isIndeterminate colorScheme="blue" />
              </Box>
            )}
            
            <Box 
              overflowX="auto" 
              borderWidth="1px" 
              borderRadius="lg" 
              bg={bgColor}
              opacity={isDragging ? 0.7 : 1}
              transition="opacity 0.2s"
            >
              <DragDropContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <Droppable droppableId="categories">
                  {(provided) => (
                    <Table variant="simple" {...provided.droppableProps} ref={provided.innerRef}>
                      <Thead>
                        <Tr>
                          <Th width="40px">
                            <Checkbox
                              isChecked={selectAll}
                              onChange={handleSelectAll}
                              colorScheme="blue"
                            />
                          </Th>
                          <Th width="40px"></Th>
                          <Th>カテゴリー名</Th>
                          <Th>スラグ</Th>
                          <Th isNumeric>表示順</Th>
                          <Th>状態</Th>
                          <Th width="150px">操作</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {categories.length > 0 ? (
                          categories.map((category, index) => (
                            <Draggable
                              key={category._id}
                              draggableId={category._id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  bg={snapshot.isDragging ? 'blue.50' : (category.parentId ? useColorModeValue('gray.50', 'gray.700') : undefined)}
                                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                >
                                  <Td>
                                    <Checkbox
                                      isChecked={selectedCategories.includes(category._id)}
                                      onChange={(e) => handleSelectCategory(e, category._id)}
                                      colorScheme="blue"
                                    />
                                  </Td>
                                  <Td {...provided.dragHandleProps}>
                                    <Icon as={FaBars} color="gray.400" />
                                  </Td>
                                  <Td>
                                    <Flex align="center">
                                      <Icon 
                                        as={category.children?.length ? FaFolderOpen : FaFolder} 
                                        color={category.children?.length ? "yellow.500" : "blue.500"} 
                                        mr={2} 
                                      />
                                      <Text fontWeight="medium">
                                        {category.emoji} {category.name}
                                      </Text>
                                      {category.parentId && (
                                        <Badge ml={2} colorScheme="purple" variant="outline">
                                          サブカテゴリー
                                        </Badge>
                                      )}
                                    </Flex>
                                  </Td>
                                  <Td>{category.slug}</Td>
                                  <Td isNumeric>{category.displayOrder}</Td>
                                  <Td>
                                    <Badge colorScheme={category.isVisible ? 'green' : 'red'}>
                                      {category.isVisible ? '表示' : '非表示'}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={1}>
                                      <IconButton
                                        aria-label="Edit Category"
                                        icon={<FaEdit />}
                                        size="sm"
                                        colorScheme="blue"
                                        onClick={() => handleEditCategory(category)}
                                      />
                                      <IconButton
                                        aria-label="Delete Category"
                                        icon={<FaTrash />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => handleDeleteClick(category)}
                                      />
                                      <Menu>
                                        <MenuButton
                                          as={IconButton}
                                          aria-label="More options"
                                          icon={<FaChevronDown />}
                                          variant="outline"
                                          size="sm"
                                        />
                                        <MenuList>
                                          <MenuItem 
                                            icon={category.isVisible ? <FaEyeSlash /> : <FaEye />} 
                                            onClick={() => handleVisibilityToggle(category)}
                                            as="button"
                                          >
                                            {category.isVisible ? '非表示にする' : '表示する'}
                                          </MenuItem>
                                          <MenuItem 
                                            icon={<FaArrowUp />} 
                                            onClick={() => handleCategoryUp(category._id)}
                                            isDisabled={index === 0}
                                            as="button"
                                          >
                                            上に移動
                                          </MenuItem>
                                          <MenuItem 
                                            icon={<FaArrowDown />} 
                                            onClick={() => handleCategoryDown(category._id)}
                                            isDisabled={index === categories.length - 1}
                                            as="button"
                                          >
                                            下に移動
                                          </MenuItem>
                                        </MenuList>
                                      </Menu>
                                    </HStack>
                                  </Td>
                                </Tr>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <Tr>
                            <Td colSpan={7} textAlign="center">カテゴリーがありません</Td>
                          </Tr>
                        )}
                        {provided.placeholder}
                      </Tbody>
                    </Table>
                  )}
                </Droppable>
              </DragDropContext>
            </Box>
          );}</React.Fragment>
        )}

        {/* カテゴリーツリービュードロワー */}
        <Drawer
          isOpen={isDrawerOpen}
          placement="right"
          onClose={onDrawerClose}
          size="md"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>カテゴリーツリー</DrawerHeader>

            <DrawerBody>
              <Text mb={4}>階層構造と親子関係が一目でわかるツリー表示です。</Text>
              
              {hierarchicalCategories.length === 0 ? (
                <Text color="gray.500">カテゴリーが登録されていません</Text>
              ) : (
                <Accordion allowMultiple defaultIndex={[0]}>
                  {renderCategoryTreeAccordion(hierarchicalCategories)}
                </Accordion>
              )}
            </DrawerBody>

            <DrawerFooter>
              <Button variant="outline" mr={3} onClick={onDrawerClose}>
                閉じる
              </Button>
              <Button 
                colorScheme="blue" 
                leftIcon={<FaPlus />}
                onClick={() => {
                  handleAddCategory();
                  onDrawerClose();
                }}
              >
                新規カテゴリー
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* カテゴリー一括表示/非表示モーダル */}
        <Modal isOpen={isBulkVisibilityOpen} onClose={onBulkVisibilityClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              カテゴリー一括{bulkVisibility ? '表示' : '非表示'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>
                選択された {selectedCategories.length} 件のカテゴリーを
                <Badge colorScheme={bulkVisibility ? 'green' : 'red'} mx={1}>
                  {bulkVisibility ? '表示' : '非表示'}
                </Badge>
                に設定します。
              </Text>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">注意:</Text>
                  <Text>
                    {bulkVisibility 
                      ? '非表示カテゴリーを表示すると、該当カテゴリーの商品がユーザーに表示されるようになります。' 
                      : 'カテゴリーを非表示にすると、該当カテゴリーの商品がユーザーに表示されなくなります。'}
                  </Text>
                </Box>
              </Alert>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onBulkVisibilityClose}>
                キャンセル
              </Button>
              <Button
                colorScheme={bulkVisibility ? 'green' : 'red'}
                onClick={handleBulkVisibilityChange}
                isLoading={bulkActionLoading}
                leftIcon={bulkVisibility ? <FaEye /> : <FaEyeSlash />}
              >
                {bulkVisibility ? '一括表示にする' : '一括非表示にする'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* カテゴリー編集モーダル */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {currentCategory ? 'カテゴリー編集' : '新規カテゴリー作成'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>カテゴリー名</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="カテゴリー名"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>親カテゴリー</FormLabel>
                  <Select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    placeholder="親カテゴリーを選択 (省略可)"
                  >
                    <option value="">親カテゴリーなし</option>
                    {categories
                      .filter(cat => !currentCategory || cat._id !== currentCategory._id)
                      .map(category => (
                        <option key={category._id} value={category._id}>
                          {category.emoji} {category.name}
                        </option>
                      ))
                    }
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>説明</FormLabel>
                  <Input
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="カテゴリーの説明"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>絵文字</FormLabel>
                  <Input
                    name="emoji"
                    value={formData.emoji}
                    onChange={handleInputChange}
                    placeholder="カテゴリーを表す絵文字"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>表示順序</FormLabel>
                  <Input
                    name="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 0
                    })}
                    placeholder="表示順序 (小さい値ほど上に表示)"
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">表示状態</FormLabel>
                  <Switch
                    isChecked={formData.isVisible}
                    onChange={(e) => setFormData({
                      ...formData,
                      isVisible: e.target.checked
                    })}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                キャンセル
              </Button>
              <Button colorScheme="blue" onClick={saveCategory}>
                保存
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 削除確認ダイアログ */}
        <AlertDialog
          isOpen={isAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={onAlertClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent as="div">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                カテゴリーの削除
              </AlertDialogHeader>
              <AlertDialogBody>
                {categoryToDelete?.name} を削除しますか？
                
                {/* 子カテゴリーがある場合は警告を表示 */}
                {categoryToDelete?.children?.length > 0 && (
                  <Text color="red.500" mt={2}>
                    警告: このカテゴリーには {categoryToDelete.children.length} 個の子カテゴリーがあります。
                    削除すると、子カテゴリーも削除されます。
                  </Text>
                )}
                
                {/* このカテゴリーに属する商品がある場合の警告も表示するとよい */}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onAlertClose}>
                  キャンセル
                </Button>
                <Button colorScheme="red" onClick={handleDeleteCategory} ml={3}>
                  削除する
                </Button>
              </AlertDialogFooter>
            </AlertDialogBody>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  if (!session.user.isAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default CategoriesPage; 