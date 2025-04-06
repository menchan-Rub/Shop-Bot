import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack,
  HStack, Image, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Spinner, Flex, Badge, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, AlertDialog, AlertDialogOverlay,
  AlertDialogContent, AlertDialogHeader, AlertDialogBody,
  AlertDialogFooter, Input, InputGroup, InputLeftElement,
  Select, IconButton, Checkbox, Menu, MenuButton, MenuList, MenuItem,
  useColorModeValue, Tooltip, Tag, TagLabel, TagCloseButton, Wrap, WrapItem,
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow, SimpleGrid,
  FormControl, FormLabel, List, ListItem, AlertIcon, Alert, Tabs, TabList, Tab,
  TabPanels, TabPanel, Progress, Divider, useMediaQuery, Stack, Center, ModalCloseButton
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSort, FaEye, FaEllipsisV, FaDownload, 
  FaUpload, FaChevronDown, FaCopy, FaTags, FaRandom, FaBoxOpen, FaChartLine, 
  FaExclamationTriangle, FaBan, FaCheck, FaSortAmountUp, FaSortAmountDown,
  FaArrowUp, FaArrowDown, FaFilter, FaShoppingCart, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';
import { getWithAuth, deleteWithAuth } from '../../../lib/api';
import AdminPageLayout from '../AdminLayout';

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'hidden';
  category: {
    _id: string;
    name: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  selected?: boolean;
  tags?: string[];
};

type Category = {
  _id: string;
  name: string;
};

const ProductsManagement = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<{ products: Product[]; pagination: any }>({ products: [], pagination: {} });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { 
    isOpen: isBulkDeleteOpen, 
    onOpen: onBulkDeleteOpen, 
    onClose: onBulkDeleteClose 
  } = useDisclosure();
  const { 
    isOpen: isBulkStatusOpen, 
    onOpen: onBulkStatusOpen, 
    onClose: onBulkStatusClose 
  } = useDisclosure();
  const [bulkStatus, setBulkStatus] = useState<string>('available');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [productToDuplicate, setProductToDuplicate] = useState<Product | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(1);
  const { 
    isOpen: isTagsModalOpen, 
    onOpen: onTagsModalOpen, 
    onClose: onTagsModalClose 
  } = useDisclosure();
  const { 
    isOpen: isDuplicateModalOpen, 
    onOpen: onDuplicateModalOpen, 
    onClose: onDuplicateModalClose 
  } = useDisclosure();
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    activeProducts: 0
  });
  const [selectedTab, setSelectedTab] = useState(0);
  
  const primaryColor = useColorModeValue('cyan.500', 'cyan.300');
  const primaryLight = useColorModeValue('cyan.50', 'cyan.900');
  const primaryMedium = useColorModeValue('cyan.100', 'cyan.800');
  const headerBgColor = useColorModeValue('white', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('cyan.100', 'cyan.700');
  const hoverBgColor = useColorModeValue('cyan.50', 'cyan.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    // ページコンポーネントマウント後に一度だけデータを読み込む
    // AdminPageLayout内で権限チェックを行うため、こちらでは単純にデータ取得のみを行う
    fetchProducts();
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    if (products?.products?.length > 0) {
      setSelectedProducts([]);
      setSelectAll(false);
      calculateProductStats();
    }
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getWithAuth(
        `/api/products?sort=${sortField}&order=${sortOrder}`
      );
      setProducts(response);
    } catch (error) {
      console.error('商品取得エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '商品の取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getWithAuth('/api/categories');
      setCategories(response.categories || []);
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await getWithAuth('/api/products/tags');
      setTags(response.tags || []);
    } catch (error) {
      console.error('タグ取得エラー:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteWithAuth(`/api/products/${productToDelete}`);
      toast({
        title: '商品を削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchProducts();
    } catch (error) {
      console.error('商品削除エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '商品の削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProductToDelete(null);
      onClose();
    }
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const filteredProducts = products?.products ? products.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category?._id === selectedCategory;
    const matchesTags = selectedTags.length === 0 || 
      (product.tags && selectedTags.every(tag => product.tags.includes(tag)));
    return matchesSearch && matchesCategory && matchesTags;
  }) : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <Badge 
            colorScheme="green" 
            fontSize="sm" 
            px={2} 
            py={1} 
            borderRadius="md"
            display="inline-flex"
            alignItems="center"
          >
            <Box as={FaCheck} size="10px" mr={1} />
            販売中
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge 
            colorScheme="red" 
            fontSize="sm" 
            px={2} 
            py={1} 
            borderRadius="md"
            display="inline-flex"
            alignItems="center"
          >
            <Box as={FaBan} size="10px" mr={1} />
            在庫切れ
          </Badge>
        );
      case 'hidden':
        return (
          <Badge 
            colorScheme="gray" 
            fontSize="sm" 
            px={2} 
            py={1} 
            borderRadius="md"
            display="inline-flex"
            alignItems="center"
          >
            <Box as={FaEye} size="10px" mr={1} />
            非表示
          </Badge>
        );
      default:
        return <Badge>不明</Badge>;
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      setSelectedProducts(filteredProducts.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const checked = e.target.checked;
    
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedProducts.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      await axios.post('/api/products/bulk-update', {
        productIds: selectedProducts,
        update: { status: bulkStatus }
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: '一括更新完了',
        description: `${selectedProducts.length}件の商品ステータスを更新しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchProducts();
      onBulkStatusClose();
    } catch (error) {
      console.error('一括ステータス更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '商品ステータスの一括更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      await axios.post('/api/products/bulk-delete', {
        productIds: selectedProducts
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: '一括削除完了',
        description: `${selectedProducts.length}件の商品を削除しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchProducts();
      onBulkDeleteClose();
    } catch (error) {
      console.error('一括削除エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '商品の一括削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportProductsCSV = () => {
    const productsToExport = selectedProducts.length > 0 
      ? products.products.filter(p => selectedProducts.includes(p._id))
      : products.products;
    
    if (productsToExport.length === 0) {
      toast({
        title: 'エクスポート対象なし',
        description: 'エクスポートする商品がありません',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const csvHeaders = ['ID', '商品名', '説明', '価格', '在庫数', 'ステータス', 'カテゴリID', 'カテゴリ名', '作成日', '更新日'];
    
    const csvContent = [
      csvHeaders.join(','),
      ...productsToExport.map(product => [
        product._id,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${product.description.replace(/"/g, '""')}"`,
        product.price,
        product.stock,
        product.status,
        product.category?._id || '',
        `"${(product.category?.name || '').replace(/"/g, '""')}"`,
        product.createdAt,
        product.updatedAt
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `products-export-${timestamp}.csv`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'エクスポート完了',
      description: `${productsToExport.length}件の商品をエクスポートしました`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDuplicateProduct = async () => {
    if (!productToDuplicate) return;
    
    try {
      const count = parseInt(duplicateCount.toString()) || 1;
      
      if (count < 1 || count > 10) {
        toast({
          title: 'エラー',
          description: '複製数は1〜10の間で指定してください',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const response = await axios.post('/api/products/duplicate', {
        productId: productToDuplicate._id,
        count: count
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: '複製完了',
        description: `${productToDuplicate.name} を ${count}個複製しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchProducts();
      onDuplicateModalClose();
      setProductToDuplicate(null);
      setDuplicateCount(1);
    } catch (error) {
      console.error('商品複製エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '商品の複製に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleOpenTagsModal = (product: Product) => {
    setCurrentProduct(product);
    setSelectedTags(product.tags || []);
    onTagsModalOpen();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const addNewTag = () => {
    if (!tagInput.trim()) return;
    
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    
    if (!selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
    }
    
    setTagInput('');
  };

  const saveProductTags = async () => {
    if (!currentProduct) return;
    
    try {
      const response = await axios.patch(`/api/products/${currentProduct._id}/tags`, {
        tags: selectedTags
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      toast({
        title: 'タグ更新完了',
        description: 'タグが更新されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchProducts();
      onTagsModalClose();
    } catch (error) {
      console.error('タグ更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'タグの更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const calculateProductStats = () => {
    const totalProducts = products.products.length;
    const outOfStock = products.products.filter(p => p.stock === 0).length;
    const lowStock = products.products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const activeProducts = products.products.filter(p => p.status === 'available').length;
    
    setProductStats({
      totalProducts,
      outOfStock,
      lowStock,
      activeProducts
    });
  };

  // すべてのRouter関連のonClick処理を修正
  const handleProductClick = (productId: string) => {
    router.push(`/admin/products/edit/${productId}`);
  };

  const handleProductDetailClick = (productId: string) => {
    router.push(`/admin/products/detail/${productId}`);
  };

  const handleViewProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  // すべてのonClickハンドラーを統一する
  const navigateTo = (url: string) => {
    router.push(url);
  };

  // 商品の削除、ステータス変更、タグ管理、複製などのハンドラー
  const handleOpenDeleteDialog = (id: string) => {
    setProductToDelete(id);
    onOpen();
  };

  const handleOpenDuplicateModal = (product: Product) => {
    setProductToDuplicate(product);
    onDuplicateModalOpen();
  };

  // handleMenuItemClickを修正
  const handleMenuItemClick = (callback: () => void) => (event: React.MouseEvent) => {
    // イベントの伝播を停止
    event.preventDefault();
    event.stopPropagation();
    
    // メニューが閉じてから実行（少し遅延）
    setTimeout(() => {
      callback();
    }, 10);
  };

  if (loading) {
    return (
      <AdminPageLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Spinner size="xl" color={primaryColor} thickness="4px" speed="0.65s" />
            <Text mt={4}>商品データを読み込み中...</Text>
          </VStack>
        </Container>
      </AdminPageLayout>
    );
  }

  // ローカルストレージのadminTokenも確認するロジックを追加
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
            onClick={() => router.push('/')}
          >
            トップページへ戻る
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <AdminPageLayout>
      <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="stretch">
          <Box 
            bgGradient="linear(to-r, cyan.400, blue.500)" 
            color="white" 
            py={6} 
            px={8} 
            borderRadius="lg" 
            boxShadow="md"
          >
            <Heading as="h1" size="xl" mb={2}>
              商品管理
            </Heading>
            <Text opacity={0.9} fontSize="lg">
              商品の追加、編集、タグ付け、一括操作を行います
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={5}>
            <Stat
              bg={cardBgColor}
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <StatLabel color={subtextColor} fontWeight="medium" fontSize="sm">総商品数</StatLabel>
              <Flex align="center" mt={1}>
                <FaBoxOpen color="var(--chakra-colors-cyan-500)" size="1.5rem" />
                <StatNumber ml={2} fontSize="2xl" fontWeight="bold" color={textColor}>{productStats.totalProducts}</StatNumber>
              </Flex>
              <StatHelpText mb={0}>全ての登録商品</StatHelpText>
            </Stat>
            
            <Stat
              bg={cardBgColor}
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <StatLabel color={subtextColor} fontWeight="medium" fontSize="sm">販売中商品</StatLabel>
              <Flex align="center" mt={1}>
                <FaShoppingCart color="var(--chakra-colors-green-500)" size="1.5rem" />
                <StatNumber ml={2} fontSize="2xl" fontWeight="bold" color={textColor}>{productStats.activeProducts}</StatNumber>
              </Flex>
              <StatHelpText mb={0}>
                <StatArrow type="increase" />
                {Math.round(productStats.activeProducts / (productStats.totalProducts || 1) * 100)}% の商品が販売中
              </StatHelpText>
            </Stat>
            
            <Stat
              bg={cardBgColor}
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="orange.100"
              boxShadow="sm"
            >
              <StatLabel color={subtextColor} fontWeight="medium" fontSize="sm">在庫わずか</StatLabel>
              <Flex align="center" mt={1}>
                <FaExclamationTriangle color="var(--chakra-colors-orange-500)" size="1.5rem" />
                <StatNumber ml={2} fontSize="2xl" fontWeight="bold" color={textColor}>{productStats.lowStock}</StatNumber>
              </Flex>
              <StatHelpText mb={0} color="orange.500">5個以下の在庫</StatHelpText>
            </Stat>
            
            <Stat
              bg={cardBgColor}
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="red.100"
              boxShadow="sm"
            >
              <StatLabel color={subtextColor} fontWeight="medium" fontSize="sm">在庫切れ</StatLabel>
              <Flex align="center" mt={1}>
                <FaBan color="var(--chakra-colors-red-500)" size="1.5rem" />
                <StatNumber ml={2} fontSize="2xl" fontWeight="bold" color={textColor}>{productStats.outOfStock}</StatNumber>
              </Flex>
              <StatHelpText mb={0} color="red.500">すぐに補充が必要</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align={{ base: 'flex-start', md: 'center' }}
            mb={6}
            gap={4}
            wrap="wrap"
          >
            <HStack spacing={3}>
              <Button
                colorScheme="cyan"
                leftIcon={<FaPlus />}
                size="md"
                fontWeight="bold"
                boxShadow="sm"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.2s"
                onClick={() => router.push('/admin/products/new')}
              >
                新規商品
              </Button>
              <Button
                variant="outline"
                colorScheme="cyan"
                size="md"
                onClick={() => router.push('/admin')}
              >
                ダッシュボードへ戻る
              </Button>
            </HStack>

            <HStack spacing={3}>
              <Menu closeOnSelect={false}>
                <MenuButton 
                  as={Button} 
                  rightIcon={<FaChevronDown />}
                  isDisabled={selectedProducts.length === 0}
                  colorScheme="cyan"
                  variant="outline"
                >
                  一括操作 ({selectedProducts.length})
                </MenuButton>
                <MenuList borderColor={borderColor} boxShadow="lg">
                  <MenuItem 
                    icon={<FaEye />} 
                    onClick={onBulkStatusOpen}
                    isDisabled={selectedProducts.length === 0}
                    as="button"
                  >
                    ステータス一括変更
                  </MenuItem>
                  <MenuItem 
                    icon={<FaTrash />} 
                    onClick={onBulkDeleteOpen}
                    isDisabled={selectedProducts.length === 0}
                    color="red.500"
                    as="button"
                  >
                    一括削除
                  </MenuItem>
                </MenuList>
              </Menu>
              
              <Menu>
                <MenuButton as={Button} rightIcon={<FaChevronDown />} colorScheme="cyan" variant="outline">
                  インポート/エクスポート
                </MenuButton>
                <MenuList borderColor={borderColor} boxShadow="lg">
                  <MenuItem icon={<FaDownload />} onClick={exportProductsCSV} as="button">
                    商品をCSVエクスポート
                  </MenuItem>
                  <MenuItem icon={<FaUpload />} onClick={() => router.push('/admin/products/import')} as="button">
                    CSVからインポート
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
          
          <Box
            p={5}
            bg={cardBgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
            mb={4}
          >
            <Tabs colorScheme="cyan" variant="enclosed" onChange={(index) => setSelectedTab(index)}>
              <TabList>
                <Tab fontWeight="semibold" _selected={{ color: primaryColor, borderColor: "currentColor", borderBottomColor: cardBgColor }}>すべての商品</Tab>
                <Tab fontWeight="semibold" _selected={{ color: primaryColor, borderColor: "currentColor", borderBottomColor: cardBgColor }}>在庫わずか</Tab>
                <Tab fontWeight="semibold" _selected={{ color: primaryColor, borderColor: "currentColor", borderBottomColor: cardBgColor }}>在庫切れ</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0} pt={4}>
                  <Flex 
                    direction={{ base: 'column', sm: 'row' }}
                    mb={6} 
                    gap={4}
                    flexWrap="wrap"
                    align="center"
                  >
                    <InputGroup maxW={{ base: "100%", md: "300px" }}>
                      <InputLeftElement pointerEvents="none">
                        <FaSearch color="var(--chakra-colors-gray-400)" />
                      </InputLeftElement>
                      <Input
                        placeholder="商品を検索..."
                        value={searchTerm}
                        onChange={handleSearch}
                        borderColor={borderColor}
                        _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px var(--chakra-colors-cyan-500)` }}
                      />
                    </InputGroup>

                    <Select
                      placeholder="カテゴリーでフィルター"
                      value={selectedCategory}
                      onChange={handleCategoryFilter}
                      maxW={{ base: "100%", md: "250px" }}
                      borderColor={borderColor}
                      _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px var(--chakra-colors-cyan-500)` }}
                      icon={<FaFilter />}
                    >
                      <option value="">すべてのカテゴリー</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                    
                    {tags.length > 0 && (
                      <Menu closeOnSelect={false}>
                        <MenuButton as={Button} rightIcon={<FaChevronDown />} leftIcon={<FaTags />} variant="outline" colorScheme="cyan">
                          タグでフィルター {selectedTags.length > 0 && `(${selectedTags.length})`}
                        </MenuButton>
                        <MenuList borderColor={borderColor} boxShadow="lg" maxH="300px" overflowY="auto">
                          {tags.map(tag => (
                            <MenuItem key={tag} onClick={() => toggleTag(tag)} as="button">
                              <Checkbox 
                                isChecked={selectedTags.includes(tag)} 
                                colorScheme="cyan" 
                                mr={2}
                              >
                                {tag}
                              </Checkbox>
                            </MenuItem>
                          ))}
                          {selectedTags.length > 0 && (
                            <MenuItem 
                              icon={<FaTrash />} 
                              onClick={() => setSelectedTags([])}
                              color="red.500"
                              as="button"
                            >
                              フィルターをクリア
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    )}
                  </Flex>
                  
                  {selectedTags.length > 0 && (
                    <Wrap mb={4}>
                      {selectedTags.map(tag => (
                        <WrapItem key={tag}>
                          <Tag size="md" colorScheme="cyan" borderRadius="full" variant="solid">
                            <TagLabel>{tag}</TagLabel>
                            <TagCloseButton onClick={() => toggleTag(tag)} />
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                </TabPanel>
                <TabPanel px={0} pt={4}>
                  <Box mb={4}>
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      在庫が5個以下の商品です。在庫管理を確認してください。
                    </Alert>
                  </Box>
                  
                  <Box overflowX="auto" bg={cardBgColor} rounded="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                    <Table variant="simple">
                      <Thead bg={primaryLight}>
                        <Tr>
                          <Th width="40px"></Th>
                          <Th width="80px">画像</Th>
                          <Th>商品名</Th>
                          <Th>価格</Th>
                          <Th>
                            <Flex align="center" cursor="pointer" onClick={() => handleSortChange('stock')}>
                              <Text mr={1}>在庫</Text>
                              <FaSortAmountDown color="var(--chakra-colors-cyan-500)" size="0.85rem" />
                            </Flex>
                          </Th>
                          <Th>カテゴリー</Th>
                          <Th>ステータス</Th>
                          <Th width="130px">操作</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {products?.products?.filter(product => product.stock > 0 && product.stock <= 5)
                          ?.map(product => (
                          <Tr 
                            key={product._id}
                            _hover={{ bg: primaryLight }}
                            transition="background-color 0.2s"
                          >
                            <Td>
                              <Checkbox
                                isChecked={selectedProducts.includes(product._id)}
                                onChange={(e) => handleSelectProduct(e, product._id)}
                                colorScheme="cyan"
                                borderColor="cyan.200"
                              />
                            </Td>
                            <Td>
                              {product.images && product.images.length > 0 ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  boxSize="50px"
                                  objectFit="cover"
                                  borderRadius="md"
                                  fallbackSrc="https://via.placeholder.com/50"
                                  border="2px solid"
                                  borderColor={borderColor}
                                />
                              ) : (
                                <Box
                                  boxSize="50px"
                                  bg={primaryLight}
                                  borderRadius="md"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  border="2px solid"
                                  borderColor={borderColor}
                                >
                                  <Text fontSize="xs" color={subtextColor}>No Image</Text>
                                </Box>
                              )}
                            </Td>
                            <Td>
                              <Text fontWeight="medium">{product.name}</Text>
                              <Text fontSize="sm" color={subtextColor} noOfLines={2}>
                                {product.description}
                              </Text>
                            </Td>
                            <Td isNumeric>¥{product.price.toLocaleString()}</Td>
                            <Td>
                              <Badge 
                                colorScheme="orange"
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                残り{product.stock}点
                              </Badge>
                              <Progress 
                                value={product.stock * 20} 
                                size="sm" 
                                colorScheme="orange" 
                                mt={1} 
                                borderRadius="full"
                                width="80px"
                              />
                            </Td>
                            <Td>{product.category?.name || '-'}</Td>
                            <Td>{getStatusBadge(product.status)}</Td>
                            <Td>
                              <Flex gap={2} wrap="wrap">
                                <IconButton
                                  aria-label="Edit"
                                  icon={<FaEdit />}
                                  size="sm"
                                  colorScheme="cyan"
                                  onClick={handleMenuItemClick(() => handleProductClick(product._id))}
                                  borderRadius="md"
                                />
                                <IconButton
                                  aria-label="Duplicate"
                                  icon={<FaCopy />}
                                  size="sm"
                                  colorScheme="blue"
                                  borderRadius="md"
                                  onClick={handleMenuItemClick(() => handleOpenDuplicateModal(product))}
                                />
                                <Menu>
                                  <MenuButton 
                                    as={IconButton} 
                                    aria-label="Options" 
                                    icon={<FaEllipsisV />} 
                                    variant="outline" 
                                    size="sm"
                                    colorScheme="gray"
                                    borderRadius="md"
                                  />
                                  <MenuList borderColor={borderColor} boxShadow="md">
                                    <MenuItem 
                                      icon={<FaEye />} 
                                      onClick={handleMenuItemClick(() => handleProductDetailClick(product._id))}
                                      as="button"
                                    >
                                      詳細を表示
                                    </MenuItem>
                                    <MenuItem 
                                      icon={<FaTags />} 
                                      onClick={handleMenuItemClick(() => handleOpenTagsModal(product))}
                                      as="button"
                                    >
                                      タグを管理
                                    </MenuItem>
                                    <MenuItem 
                                      icon={<FaCopy />} 
                                      onClick={handleMenuItemClick(() => handleOpenDuplicateModal(product))}
                                      as="button"
                                    >
                                      商品を複製
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                    
                    {products?.products?.filter(product => product.stock > 0 && product.stock <= 5).length === 0 && (
                      <Box p={6} textAlign="center">
                        <Text color={subtextColor}>在庫わずかの商品はありません</Text>
                      </Box>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel px={0} pt={4}>
                  <Box mb={4}>
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      在庫がない商品です。至急補充するか、ステータスを変更してください。
                    </Alert>
                  </Box>
                  
                  <Box overflowX="auto" bg={cardBgColor} rounded="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                    <Table variant="simple">
                      <Thead bg={primaryLight}>
                        <Tr>
                          <Th width="40px"></Th>
                          <Th width="80px">画像</Th>
                          <Th>商品名</Th>
                          <Th>価格</Th>
                          <Th>在庫</Th>
                          <Th>カテゴリー</Th>
                          <Th>ステータス</Th>
                          <Th width="130px">操作</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {products?.products?.filter(product => product.stock === 0)
                          ?.map(product => (
                          <Tr 
                            key={product._id}
                            _hover={{ bg: primaryLight }}
                            transition="background-color 0.2s"
                          >
                            <Td>
                              <Checkbox
                                isChecked={selectedProducts.includes(product._id)}
                                onChange={(e) => handleSelectProduct(e, product._id)}
                                colorScheme="cyan"
                                borderColor="cyan.200"
                              />
                            </Td>
                            <Td>
                              {product.images && product.images.length > 0 ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  boxSize="50px"
                                  objectFit="cover"
                                  borderRadius="md"
                                  fallbackSrc="https://via.placeholder.com/50"
                                  border="2px solid"
                                  borderColor={borderColor}
                                  opacity={0.7}
                                  filter="grayscale(50%)"
                                />
                              ) : (
                                <Box
                                  boxSize="50px"
                                  bg={primaryLight}
                                  borderRadius="md"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  border="2px solid"
                                  borderColor={borderColor}
                                >
                                  <Text fontSize="xs" color={subtextColor}>No Image</Text>
                                </Box>
                              )}
                            </Td>
                            <Td>
                              <Text fontWeight="medium">{product.name}</Text>
                              <Text fontSize="sm" color={subtextColor} noOfLines={2}>
                                {product.description}
                              </Text>
                            </Td>
                            <Td isNumeric>¥{product.price.toLocaleString()}</Td>
                            <Td>
                              <Badge 
                                colorScheme="red"
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                在庫なし
                              </Badge>
                            </Td>
                            <Td>{product.category?.name || '-'}</Td>
                            <Td>{getStatusBadge(product.status)}</Td>
                            <Td>
                              <Flex gap={2} wrap="wrap">
                                <IconButton
                                  aria-label="Edit"
                                  icon={<FaEdit />}
                                  size="sm"
                                  colorScheme="cyan"
                                  onClick={handleMenuItemClick(() => handleProductClick(product._id))}
                                  borderRadius="md"
                                />
                                <IconButton
                                  aria-label="Duplicate"
                                  icon={<FaCopy />}
                                  size="sm"
                                  colorScheme="blue"
                                  borderRadius="md"
                                  onClick={handleMenuItemClick(() => handleOpenDuplicateModal(product))}
                                />
                                <Menu>
                                  <MenuButton 
                                    as={IconButton} 
                                    aria-label="Options" 
                                    icon={<FaEllipsisV />} 
                                    variant="outline" 
                                    size="sm"
                                    colorScheme="gray"
                                    borderRadius="md"
                                  />
                                  <MenuList borderColor={borderColor} boxShadow="md">
                                    <MenuItem 
                                      icon={<FaEye />} 
                                      onClick={handleMenuItemClick(() => handleProductDetailClick(product._id))}
                                      as="button"
                                    >
                                      詳細を表示
                                    </MenuItem>
                                    <MenuItem 
                                      icon={<FaTags />} 
                                      onClick={handleMenuItemClick(() => handleOpenTagsModal(product))}
                                      as="button"
                                    >
                                      タグを管理
                                    </MenuItem>
                                    <MenuItem 
                                      icon={<FaCopy />} 
                                      onClick={handleMenuItemClick(() => handleOpenDuplicateModal(product))}
                                      as="button"
                                    >
                                      商品を複製
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                    
                    {products?.products?.filter(product => product.stock === 0).length === 0 && (
                      <Box p={6} textAlign="center">
                        <Text color={subtextColor}>在庫切れの商品はありません</Text>
                      </Box>
                    )}
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>

          <Box overflowX="auto" bg={cardBgColor} rounded="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <Table variant="simple">
              <Thead bg={primaryLight}>
                <Tr>
                  <Th width="40px">
                    <Checkbox
                      isChecked={selectAll}
                      onChange={handleSelectAll}
                      colorScheme="cyan"
                      borderColor="cyan.200"
                    />
                  </Th>
                  <Th width="80px">画像</Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('name')}>
                      <Text>商品名</Text>
                      {sortField === 'name' && (
                        <Box color="cyan.500">
                          {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                        </Box>
                      )}
                    </HStack>
                  </Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('price')}>
                      <Text>価格</Text>
                      {sortField === 'price' && (
                        <Box color="cyan.500">
                          {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                        </Box>
                      )}
                    </HStack>
                  </Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('stock')}>
                      <Text>在庫</Text>
                      {sortField === 'stock' && (
                        <Box color="cyan.500">
                          {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                        </Box>
                      )}
                    </HStack>
                  </Th>
                  <Th>カテゴリー</Th>
                  <Th>ステータス</Th>
                  <Th>タグ</Th>
                  <Th width="130px">操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredProducts.map(product => (
                  <Tr 
                    key={product._id}
                    _hover={{ bg: primaryLight }}
                    transition="background-color 0.2s"
                    opacity={product.status === 'hidden' ? 0.7 : 1}
                  >
                    <Td>
                      <Checkbox
                        isChecked={selectedProducts.includes(product._id)}
                        onChange={(e) => handleSelectProduct(e, product._id)}
                        colorScheme="cyan"
                        borderColor="cyan.200"
                      />
                    </Td>
                    <Td>
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          boxSize="50px"
                          objectFit="cover"
                          borderRadius="md"
                          fallbackSrc="https://via.placeholder.com/50"
                          border="2px solid"
                          borderColor={borderColor}
                          filter={product.stock === 0 ? "grayscale(50%)" : "none"}
                        />
                      ) : (
                        <Box
                          boxSize="50px"
                          bg={primaryLight}
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          border="2px solid"
                          borderColor={borderColor}
                        >
                          <Text fontSize="xs" color={subtextColor}>No Image</Text>
                        </Box>
                      )}
                    </Td>
                    <Td>
                      <Text fontWeight="medium">{product.name}</Text>
                      <Text fontSize="sm" color={subtextColor} noOfLines={2}>
                        {product.description}
                      </Text>
                    </Td>
                    <Td isNumeric>
                      <Text fontWeight="bold">¥{product.price.toLocaleString()}</Text>
                    </Td>
                    <Td>
                      {product.stock > 10 ? (
                        <Badge colorScheme="green" fontSize="sm" px={2} py={1} borderRadius="md">
                          {product.stock.toLocaleString()}
                        </Badge>
                      ) : product.stock > 0 ? (
                        <Badge colorScheme="orange" fontSize="sm" px={2} py={1} borderRadius="md">
                          残り{product.stock}点
                        </Badge>
                      ) : (
                        <Badge colorScheme="red" fontSize="sm" px={2} py={1} borderRadius="md">
                          在庫なし
                        </Badge>
                      )}
                      
                      {product.stock > 0 && product.stock <= 10 && (
                        <Progress 
                          value={product.stock * 10} 
                          size="sm" 
                          colorScheme={product.stock <= 5 ? "orange" : "green"} 
                          mt={1} 
                          borderRadius="full"
                          width="80px"
                        />
                      )}
                    </Td>
                    <Td>
                      {product.category?.name ? (
                        <Badge 
                          variant="subtle" 
                          colorScheme="cyan" 
                          px={2} 
                          py={1} 
                          borderRadius="md"
                        >
                          {product.category.name}
                        </Badge>
                      ) : (
                        <Text fontSize="sm" color={subtextColor}>-</Text>
                      )}
                    </Td>
                    <Td>{getStatusBadge(product.status)}</Td>
                    <Td>
                      {product.tags && product.tags.length > 0 ? (
                        <Flex wrap="wrap" gap={1}>
                          {product.tags.slice(0, 2).map(tag => (
                            <Tag key={tag} size="sm" colorScheme="blue" borderRadius="full">
                              {tag}
                            </Tag>
                          ))}
                          {product.tags.length > 2 && (
                            <Tag size="sm" colorScheme="gray" borderRadius="full">
                              +{product.tags.length - 2}
                            </Tag>
                          )}
                        </Flex>
                      ) : (
                        <Text fontSize="sm" color={subtextColor}>-</Text>
                      )}
                    </Td>
                    <Td>
                      <Flex gap={2} wrap="wrap">
                        <IconButton
                          aria-label="Edit"
                          icon={<FaEdit />}
                          size="sm"
                          colorScheme="cyan"
                          onClick={handleMenuItemClick(() => handleProductClick(product._id))}
                          borderRadius="md"
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleOpenDeleteDialog(product._id)}
                          borderRadius="md"
                        />
                        <Menu>
                          <MenuButton 
                            as={IconButton} 
                            aria-label="Options" 
                            icon={<FaEllipsisV />} 
                            variant="outline" 
                            size="sm"
                            colorScheme="gray"
                            borderRadius="md"
                          />
                          <MenuList borderColor={borderColor} boxShadow="md">
                            <MenuItem 
                              icon={<FaEye />} 
                              onClick={handleMenuItemClick(() => handleProductDetailClick(product._id))}
                              as="button"
                            >
                              詳細を表示
                            </MenuItem>
                            <MenuItem 
                              icon={<FaTags />} 
                              onClick={handleMenuItemClick(() => handleOpenTagsModal(product))}
                              as="button"
                            >
                              タグを管理
                            </MenuItem>
                            <MenuItem 
                              icon={<FaCopy />} 
                              onClick={handleMenuItemClick(() => handleOpenDuplicateModal(product))}
                              as="button"
                            >
                              商品を複製
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            {filteredProducts.length === 0 && (
              <Box p={6} textAlign="center">
                <Text color={subtextColor}>商品が見つかりません</Text>
              </Box>
            )}
          </Box>
        </VStack>

        <Modal isOpen={isTagsModalOpen} onClose={onTagsModalClose}>
          <ModalOverlay backdropFilter="blur(2px)" />
          <ModalContent borderRadius="lg" boxShadow="xl">
            <ModalHeader 
              bg={primaryLight} 
              color={textColor}
              borderTopLeftRadius="lg" 
              borderTopRightRadius="lg"
              fontWeight="bold"
            >
              タグ管理: {currentProduct?.name}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={5}>
              <VStack spacing={4} align="stretch">
                <Text mb={2}>
                  タグを選択または新しいタグを追加してください
                </Text>
                
                <Flex gap={2}>
                  <Input
                    placeholder="新しいタグを追加..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
                    borderColor={borderColor}
                    _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px var(--chakra-colors-cyan-500)` }}
                  />
                  <Button colorScheme="cyan" onClick={addNewTag}>
                    追加
                  </Button>
                </Flex>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>現在のタグ:</Text>
                  <Wrap mb={4} p={3} bg={primaryLight} borderRadius="md">
                    {selectedTags.length > 0 ? selectedTags.map(tag => (
                      <WrapItem key={tag}>
                        <Tag size="md" colorScheme="cyan" borderRadius="full">
                          <TagLabel>{tag}</TagLabel>
                          <TagCloseButton onClick={() => toggleTag(tag)} />
                        </Tag>
                      </WrapItem>
                    )) : (
                      <Text color={subtextColor}>タグはまだありません</Text>
                    )}
                  </Wrap>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>利用可能なタグ:</Text>
                  <Wrap>
                    {tags.filter(tag => !selectedTags.includes(tag)).map(tag => (
                      <WrapItem key={tag}>
                        <Tag 
                          size="md" 
                          colorScheme="gray" 
                          borderRadius="full" 
                          cursor="pointer"
                          onClick={() => toggleTag(tag)}
                          _hover={{ bg: 'gray.200' }}
                        >
                          <TagLabel>{tag}</TagLabel>
                          <TagCloseButton ml={1} as={FaPlus} boxSize={2} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter bg={primaryLight} borderBottomLeftRadius="lg" borderBottomRightRadius="lg">
              <Button variant="ghost" mr={3} onClick={onTagsModalClose}>
                キャンセル
              </Button>
              <Button colorScheme="cyan" onClick={saveProductTags}>
                保存
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isDuplicateModalOpen} onClose={onDuplicateModalClose}>
          <ModalOverlay backdropFilter="blur(2px)" />
          <ModalContent borderRadius="lg" boxShadow="xl">
            <ModalHeader 
              bg={primaryLight} 
              color={textColor}
              borderTopLeftRadius="lg" 
              borderTopRightRadius="lg"
              fontWeight="bold"
            >
              商品を複製
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={5}>
              <VStack spacing={4} align="stretch">
                <Text>
                  「{productToDuplicate?.name}」を複製します。
                </Text>
                
                <FormControl>
                  <FormLabel fontWeight="medium">複製数</FormLabel>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={duplicateCount}
                    onChange={(e) => setDuplicateCount(parseInt(e.target.value) || 1)}
                    borderColor={borderColor}
                    _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px var(--chakra-colors-cyan-500)` }}
                  />
                  <Text fontSize="sm" color={subtextColor} mt={1}>
                    1〜10個の範囲で指定してください
                  </Text>
                </FormControl>
                
                <Alert status="info" borderRadius="md" bg={primaryLight} borderLeftWidth="4px" borderLeftColor="cyan.500">
                  <Box>
                    複製された商品は元の商品の以下の情報をコピーします:
                    <List mt={1} spacing={1}>
                      <ListItem>商品名 (複製1, 複製2...が追加されます)</ListItem>
                      <ListItem>説明</ListItem>
                      <ListItem>価格</ListItem>
                      <ListItem>カテゴリー</ListItem>
                      <ListItem>画像</ListItem>
                      <ListItem>タグ</ListItem>
                    </List>
                  </Box>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter bg={primaryLight} borderBottomLeftRadius="lg" borderBottomRightRadius="lg">
              <Button variant="ghost" mr={3} onClick={onDuplicateModalClose}>
                キャンセル
              </Button>
              <Button
                colorScheme="cyan"
                onClick={handleDuplicateProduct}
                leftIcon={<FaCopy />}
              >
                複製する
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isBulkStatusOpen} onClose={onBulkStatusClose}>
          <ModalOverlay backdropFilter="blur(2px)" />
          <ModalContent borderRadius="lg" boxShadow="xl">
            <ModalHeader 
              bg={primaryLight} 
              color={textColor}
              borderTopLeftRadius="lg" 
              borderTopRightRadius="lg"
              fontWeight="bold"
            >
              商品ステータス一括変更
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={5}>
              <Text mb={4}>
                選択された <Badge colorScheme="cyan" fontSize="md" px={2} py={1} borderRadius="md">{selectedProducts.length}</Badge> 件の商品のステータスを一括変更します。
              </Text>
              <FormControl>
                <FormLabel fontWeight="medium">新しいステータス</FormLabel>
                <Select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px var(--chakra-colors-cyan-500)` }}
                >
                  <option value="available">販売中</option>
                  <option value="out_of_stock">在庫切れ</option>
                  <option value="hidden">非表示</option>
                </Select>
              </FormControl>
            </ModalBody>
            <ModalFooter bg={primaryLight} borderBottomLeftRadius="lg" borderBottomRightRadius="lg">
              <Button variant="ghost" mr={3} onClick={onBulkStatusClose}>
                キャンセル
              </Button>
              <Button
                colorScheme="cyan"
                onClick={handleBulkStatusChange}
                isLoading={bulkActionLoading}
              >
                更新する
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <AlertDialog
          isOpen={isBulkDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onBulkDeleteClose}
        >
          <AlertDialogOverlay backdropFilter="blur(2px)">
            <AlertDialogContent borderRadius="lg" boxShadow="xl">
              <AlertDialogHeader 
                fontSize="lg" 
                fontWeight="bold" 
                bg={primaryLight} 
                borderTopLeftRadius="lg" 
                borderTopRightRadius="lg"
              >
                商品の一括削除
              </AlertDialogHeader>
              <AlertDialogBody p={5}>
                <VStack align="stretch" spacing={4}>
                  <Text>
                    選択された <Badge colorScheme="red" fontSize="md" px={2} py={1} borderRadius="md">{selectedProducts.length}</Badge> 件の商品を削除しますか？
                  </Text>
                  <Alert status="error" variant="left-accent" borderRadius="md">
                    <AlertIcon />
                    この操作は元に戻すことができません。
                  </Alert>
                </VStack>
              </AlertDialogBody>
              <AlertDialogFooter bg={primaryLight} borderBottomLeftRadius="lg" borderBottomRightRadius="lg">
                <Button ref={cancelRef} onClick={onBulkDeleteClose}>
                  キャンセル
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleBulkDelete}
                  ml={3}
                  isLoading={bulkActionLoading}
                >
                  削除する
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay backdropFilter="blur(2px)">
            <AlertDialogContent borderRadius="lg" boxShadow="xl">
              <AlertDialogHeader 
                fontSize="lg" 
                fontWeight="bold" 
                bg={primaryLight} 
                borderTopLeftRadius="lg" 
                borderTopRightRadius="lg"
              >
                商品の削除
              </AlertDialogHeader>
              <AlertDialogBody p={5}>
                <VStack align="stretch" spacing={4}>
                  <Text>この商品を削除しますか？</Text>
                  <Alert status="error" variant="left-accent" borderRadius="md">
                    <AlertIcon />
                    この操作は元に戻すことができません。
                  </Alert>
                </VStack>
              </AlertDialogBody>
              <AlertDialogFooter bg={primaryLight} borderBottomLeftRadius="lg" borderBottomRightRadius="lg">
                <Button ref={cancelRef} onClick={onClose}>
                  キャンセル
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteConfirm}
                  ml={3}
                >
                  削除する
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </AdminPageLayout>
  );
};

export default ProductsManagement; 