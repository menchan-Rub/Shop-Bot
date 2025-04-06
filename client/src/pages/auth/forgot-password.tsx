import React, { useState } from 'react';
import { 
  Box, Button, Container, Heading, Text, VStack,
  FormControl, FormLabel, Input, FormErrorMessage,
  useColorModeValue, useToast, Link, Alert, AlertIcon
} from '@chakra-ui/react';
import NextLink from 'next/link';
import Layout from '@/components/Layout';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

export default function ForgotPassword() {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // フォーム状態
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        email
      });
      
      setIsSubmitted(true);
      
      toast({
        title: 'メール送信完了',
        description: response.data.message || 'パスワードリセットの手順をメールで送信しました',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // エラーメッセージを表示
      setError(error.response?.data?.error || 'リクエスト処理中にエラーが発生しました');
      
      toast({
        title: 'エラー',
        description: error.response?.data?.error || 'リクエスト処理中にエラーが発生しました',
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
          {isSubmitted ? (
            <VStack spacing={6}>
              <Heading as="h1" size="xl" textAlign="center">
                メール送信完了
              </Heading>
              
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                パスワードリセット用のリンクを記載したメールを送信しました。メールをご確認ください。
              </Alert>
              
              <Text textAlign="center">
                メールが届かない場合は、迷惑メールフォルダをご確認いただくか、別のメールアドレスで再度お試しください。
              </Text>
              
              <Button
                leftIcon={<FaArrowLeft />}
                as={NextLink}
                href="/auth/signin"
                variant="outline"
              >
                ログインページに戻る
              </Button>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <Heading as="h1" size="xl" textAlign="center">
                  パスワードをお忘れですか？
                </Heading>
                
                <Text textAlign="center">
                  アカウントに登録されているメールアドレスを入力してください。
                  パスワードリセット用のリンクをメールで送信します。
                </Text>
                
                <FormControl isRequired isInvalid={!!error}>
                  <FormLabel>メールアドレス</FormLabel>
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="登録したメールアドレス"
                  />
                  {error && <FormErrorMessage>{error}</FormErrorMessage>}
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="blue"
                  w="full"
                  isLoading={isSubmitting}
                  loadingText="送信中..."
                >
                  リセットリンクを送信
                </Button>
                
                <Text fontSize="sm">
                  <NextLink href="/auth/signin" passHref>
                    <Link color="blue.500">ログインページに戻る</Link>
                  </NextLink>
                </Text>
              </VStack>
            </form>
          )}
        </Box>
      </Container>
    </Layout>
  );
} 