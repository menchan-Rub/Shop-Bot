import React, { useState } from 'react';
import { 
  Box, Button, Container, Heading, Text, VStack, HStack,
  FormControl, FormLabel, Input, InputGroup, InputRightElement,
  FormErrorMessage, useColorModeValue, useToast, Checkbox, Link,
  Divider
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { FaEye, FaEyeSlash, FaDiscord } from 'react-icons/fa';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import axios from 'axios';

export default function SignUp() {
  const router = useRouter();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // フォーム状態
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  // エラー状態
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  
  // 送信状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // パスワード表示切り替え
  const handleTogglePassword = () => setShowPassword(!showPassword);
  
  // フォームバリデーション
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!username.trim()) {
      newErrors.username = 'ユーザー名を入力してください';
    }
    
    if (!email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (password.length < 8) {
      newErrors.password = 'パスワードは8文字以上にしてください';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }
    
    if (!acceptTerms || !acceptPrivacy) {
      newErrors.terms = '利用規約とプライバシーポリシーに同意する必要があります';
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
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        username,
        email,
        password,
        acceptTerms,
        acceptPrivacyPolicy: acceptPrivacy
      });
      
      toast({
        title: '登録完了',
        description: response.data.message || '登録が完了しました。メールをご確認ください。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 登録完了画面に遷移
      router.push('/auth/registration-success');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // エラーメッセージを表示
      toast({
        title: '登録エラー',
        description: error.response?.data?.error || 'アカウント登録中にエラーが発生しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="flex-start" w="full">
              <Heading as="h1" size="xl" textAlign="center" w="full">
                アカウント登録
              </Heading>
              
              <FormControl isRequired isInvalid={!!errors.username}>
                <FormLabel>ユーザー名</FormLabel>
                <Input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ユーザー名"
                />
                <FormErrorMessage>{errors.username}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.email}>
                <FormLabel>メールアドレス</FormLabel>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.password}>
                <FormLabel>パスワード</FormLabel>
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
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                <FormLabel>パスワード (確認)</FormLabel>
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワードをもう一度入力"
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.terms}>
                <VStack align="flex-start" spacing={2}>
                  <Checkbox 
                    isChecked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  >
                    <Text fontSize="sm">
                      <NextLink href="/terms" passHref>
                        <Link color="blue.500" isExternal>利用規約</Link>
                      </NextLink>
                      に同意します
                    </Text>
                  </Checkbox>
                  
                  <Checkbox 
                    isChecked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  >
                    <Text fontSize="sm">
                      <NextLink href="/privacy" passHref>
                        <Link color="blue.500" isExternal>プライバシーポリシー</Link>
                      </NextLink>
                      に同意します
                    </Text>
                  </Checkbox>
                  {errors.terms && (
                    <Text color="red.500" fontSize="sm">{errors.terms}</Text>
                  )}
                </VStack>
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="blue"
                w="full"
                isLoading={isSubmitting}
                loadingText="登録中..."
              >
                登録する
              </Button>
              
              <Divider />
              
              <VStack w="full" spacing={4}>
                <Text fontSize="sm">または</Text>
                
                <Button
                  leftIcon={<FaDiscord />}
                  colorScheme="purple"
                  w="full"
                  onClick={() => signIn('discord', { callbackUrl: '/' })}
                >
                  Discordで登録
                </Button>
              </VStack>
              
              <HStack w="full" justify="center">
                <Text fontSize="sm">
                  すでにアカウントをお持ちですか？
                </Text>
                <NextLink href="/auth/signin" passHref>
                  <Link color="blue.500">ログイン</Link>
                </NextLink>
              </HStack>
            </VStack>
          </form>
        </Box>
      </Container>
    </Layout>
  );
} 