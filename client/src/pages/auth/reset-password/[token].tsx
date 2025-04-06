import React, { useState } from 'react';
import { 
  Box, Button, Container, Heading, Text, VStack,
  FormControl, FormLabel, Input, InputGroup, InputRightElement,
  FormErrorMessage, useColorModeValue, useToast, Alert, AlertIcon
} from '@chakra-ui/react';
import Layout from '@/components/Layout';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // フォーム状態
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  
  // パスワード表示切り替え
  const handleTogglePassword = () => setShowPassword(!showPassword);
  
  // フォームバリデーション
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!password) {
      newErrors.password = '新しいパスワードを入力してください';
    } else if (password.length < 8) {
      newErrors.password = 'パスワードは8文字以上にしてください';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!token || typeof token !== 'string') {
      setErrors({
        general: '無効なリセットトークンです。もう一度パスワードリセットをリクエストしてください。'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/${token}`, {
        password
      });
      
      setIsSubmitted(true);
      
      toast({
        title: 'パスワード変更完了',
        description: response.data.message || 'パスワードが正常にリセットされました',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // エラーメッセージを表示
      setErrors({
        general: error.response?.data?.error || 'パスワードリセット中にエラーが発生しました'
      });
      
      toast({
        title: 'エラー',
        description: error.response?.data?.error || 'パスワードリセット中にエラーが発生しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // トークンがない場合のエラー表示
  if (!token && typeof window !== 'undefined') {
    return (
      <Layout>
        <Container maxW="container.md" py={10}>
          <Box
            bg={bgColor}
            p={8}
            borderRadius="lg"
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            w="full"
            maxW="md"
            mx="auto"
          >
            <VStack spacing={6}>
              <Heading as="h1" size="xl" textAlign="center">
                エラー
              </Heading>
              
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                無効なリセットリンクです。もう一度パスワードリセットをリクエストしてください。
              </Alert>
              
              <Button
                leftIcon={<FaArrowLeft />}
                as={Link}
                href="/auth/forgot-password"
                variant="outline"
              >
                パスワードリセットに戻る
              </Button>
            </VStack>
          </Box>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxW="container.md" py={10}>
        <Box
          bg={bgColor}
          p={8}
          borderRadius="lg"
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          w="full"
          maxW="md"
          mx="auto"
        >
          {isSubmitted ? (
            <VStack spacing={6}>
              <Heading as="h1" size="xl" textAlign="center">
                パスワード変更完了
              </Heading>
              
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                パスワードが正常に変更されました。新しいパスワードでログインしてください。
              </Alert>
              
              <Button
                as={Link}
                href="/auth/signin"
                colorScheme="blue"
                w="full"
              >
                ログインページへ
              </Button>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <Heading as="h1" size="xl" textAlign="center">
                  新しいパスワードを設定
                </Heading>
                
                <Text textAlign="center">
                  安全なパスワードを設定してください。8文字以上で、数字と記号を含めることをおすすめします。
                </Text>
                
                {errors.general && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {errors.general}
                  </Alert>
                )}
                
                <FormControl isRequired isInvalid={!!errors.password}>
                  <FormLabel>新しいパスワード</FormLabel>
                  <InputGroup>
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8文字以上のパスワード"
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleTogglePassword}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                </FormControl>
                
                <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                  <FormLabel>パスワードの確認</FormLabel>
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードをもう一度入力"
                  />
                  {errors.confirmPassword && <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>}
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="blue"
                  w="full"
                  isLoading={isSubmitting}
                  loadingText="送信中..."
                >
                  パスワードを変更する
                </Button>
                
                <Button
                  leftIcon={<FaArrowLeft />}
                  as={Link}
                  href="/auth/signin"
                  variant="ghost"
                  size="sm"
                >
                  ログインページに戻る
                </Button>
              </VStack>
            </form>
          )}
        </Box>
      </Container>
    </Layout>
  );
} 