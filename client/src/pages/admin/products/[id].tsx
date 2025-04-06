import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Heading, Button, VStack,
  FormControl, FormLabel, Input, Textarea,
  Select, NumberInput, NumberInputField,
  NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, HStack, useToast,
  Spinner, Flex, Image, IconButton, SimpleGrid,
  Text, Switch, FormHelperText
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { FaUpload, FaTrash, FaArrowLeft } from 'react-icons/fa';

type Category = {
  _id: string;
  name: string;
};

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  status: 'available' | 'out_of_stock' | 'hidden';
  images: string[];
  existingImages: string[];
};

const ProductForm = () => {
  const router = useRouter();
  const { id } = router.query;
  const isNewProduct = id === 'new';
  const { data: session } = useSession();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: '',
    status: 'available',
    images: [],
    existingImages: []
  });

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchCategories();
      if (!isNewProduct && id) {
        fetchProduct(id as string);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [session, id, isNewProduct]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'カテゴリの取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${productId}`);
      const product = response.data;
      
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.category?._id || '',
        status: product.status,
        images: [],
        existingImages: product.images || []
      });
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      status: checked ? 'available' : 'hidden'
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', files[0]);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, response.data.url]
      }));

      toast({
        title: '画像をアップロードしました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '画像のアップロードに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: '入力エラー',
        description: '商品名、価格、カテゴリーは必須項目です',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // フォームデータの準備
      const productData = {
        ...formData,
        images: [...formData.images, ...formData.existingImages], // 新しい画像と既存の画像を結合
        category: formData.categoryId // APIが期待するフィールド名に調整
      };
      
      if (isNewProduct) {
        await axios.post('/api/products', productData);
        toast({
          title: '商品を追加しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await axios.put(`/api/products/${id}`, productData);
        toast({
          title: '商品を更新しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      router.push('/admin/products');
    } catch (error) {
      console.error('商品保存エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: error.response?.data?.error || '商品の保存に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading>アクセス権限がありません</Heading>
          <Text>このページにアクセスするには管理者権限が必要です</Text>
          <Button colorScheme="blue" onClick={() => router.push('/')}>
            トップページへ戻る
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch" as="form" onSubmit={handleSubmit}>
        <HStack>
          <Button
            leftIcon={<FaArrowLeft />}
            variant="outline"
            onClick={() => router.push('/admin/products')}
          >
            戻る
          </Button>
          <Box flex="1">
            <Heading as="h1" size="xl" textAlign="center">
              {isNewProduct ? '新規商品追加' : '商品編集'}
            </Heading>
          </Box>
        </HStack>

        <FormControl isRequired>
          <FormLabel>商品名</FormLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="商品名を入力してください"
          />
        </FormControl>

        <FormControl>
          <FormLabel>商品説明</FormLabel>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="商品の説明を入力してください"
            rows={5}
          />
        </FormControl>

        <HStack spacing={4} align="flex-start">
          <FormControl isRequired>
            <FormLabel>価格（ポイント）</FormLabel>
            <NumberInput
              min={0}
              value={formData.price}
              onChange={(value) => handleNumberInputChange('price', value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>在庫数</FormLabel>
            <NumberInput
              min={0}
              value={formData.stock}
              onChange={(value) => handleNumberInputChange('stock', value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <FormControl isRequired>
          <FormLabel>カテゴリー</FormLabel>
          <Select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
            placeholder="カテゴリーを選択してください"
          >
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="status-switch" mb="0">
            商品を公開する
          </FormLabel>
          <Switch
            id="status-switch"
            isChecked={formData.status === 'available'}
            onChange={handleSwitchChange}
            colorScheme="green"
          />
          <FormHelperText ml={2}>
            {formData.status === 'available' ? '公開中' : '非公開'}
          </FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>商品画像</FormLabel>
          <VStack spacing={4} align="stretch">
            <HStack>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <Button
                leftIcon={<FaUpload />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploadingImage}
                loadingText="アップロード中"
                colorScheme="blue"
              >
                画像をアップロード
              </Button>
              <Text fontSize="sm" color="gray.500">
                推奨サイズ: 800x600px
              </Text>
            </HStack>

            {formData.images.length > 0 ? (
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                {formData.images.map((image, index) => (
                  <Box
                    key={index}
                    position="relative"
                    borderWidth="1px"
                    borderRadius="md"
                    overflow="hidden"
                  >
                    <Image
                      src={image}
                      alt={`Product image ${index + 1}`}
                      w="100%"
                      h="150px"
                      objectFit="cover"
                    />
                    <IconButton
                      aria-label="Remove image"
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      position="absolute"
                      top="2"
                      right="2"
                      onClick={() => handleRemoveImage(index)}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Box
                borderWidth="1px"
                borderRadius="md"
                borderStyle="dashed"
                p={10}
                textAlign="center"
              >
                <Text color="gray.500">
                  画像がまだアップロードされていません
                </Text>
              </Box>
            )}
          </VStack>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          isLoading={submitting}
          loadingText={isNewProduct ? '追加中...' : '更新中...'}
        >
          {isNewProduct ? '商品を追加する' : '商品を更新する'}
        </Button>
      </VStack>
    </Container>
  );
};

export default ProductForm; 