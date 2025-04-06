import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Select,
  FormErrorMessage,
  useToast,
  SimpleGrid,
  Icon,
  Flex,
  HStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import Layout from '@/components/Layout';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'お名前を入力してください';
    }
    
    if (!email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!subject) {
      newErrors.subject = 'お問い合わせ種別を選択してください';
    }
    
    if (!message.trim()) {
      newErrors.message = 'お問い合わせ内容を入力してください';
    } else if (message.length < 10) {
      newErrors.message = 'お問い合わせ内容は10文字以上入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // APIエンドポイントが存在すれば実際に送信処理を行う
      // const response = await axios.post('/api/contact', { name, email, subject, message });
      
      // デモ用に送信成功を模擬
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      toast({
        title: 'お問い合わせを受け付けました',
        description: '担当者より順次ご連絡いたします',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: 'しばらく経ってからもう一度お試しください',
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
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={6}>
            <Heading as="h1" size="xl" mb={4}>お問い合わせ</Heading>
            <Text fontSize="lg" color="gray.500">
              ご質問やご相談などお気軽にお問い合わせください
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <VStack
              align="stretch"
              bg={bgColor}
              p={8}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="md"
              spacing={6}
            >
              <Heading as="h2" size="md" mb={2}>お問い合わせフォーム</Heading>
              <Text>以下のフォームに必要事項をご入力の上、送信してください。</Text>

              {isSuccess ? (
                <Box
                  p={6}
                  bg="green.50"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="green.200"
                  textAlign="center"
                >
                  <Icon as={FaCheck} w={12} h={12} color="green.500" mb={4} />
                  <Heading as="h3" size="md" mb={2}>お問い合わせを受け付けました</Heading>
                  <Text>
                    お問い合わせありがとうございます。
                    内容を確認の上、担当者より順次ご連絡いたします。
                    通常2営業日以内にご返信いたします。
                  </Text>
                  <Button
                    mt={4}
                    colorScheme="green"
                    onClick={() => setIsSuccess(false)}
                  >
                    新しいお問い合わせ
                  </Button>
                </Box>
              ) : (
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4} align="stretch">
                    <FormControl isInvalid={!!errors.name} isRequired>
                      <FormLabel>お名前</FormLabel>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例：山田 太郎"
                      />
                      {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isInvalid={!!errors.email} isRequired>
                      <FormLabel>メールアドレス</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="例：example@email.com"
                      />
                      {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isInvalid={!!errors.subject} isRequired>
                      <FormLabel>お問い合わせ種別</FormLabel>
                      <Select
                        placeholder="お問い合わせ種別を選択してください"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      >
                        <option value="general">一般的なお問い合わせ</option>
                        <option value="product">商品について</option>
                        <option value="payment">お支払いについて</option>
                        <option value="technical">技術的な問題</option>
                        <option value="refund">返金・返品について</option>
                        <option value="other">その他</option>
                      </Select>
                      {errors.subject && <FormErrorMessage>{errors.subject}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isInvalid={!!errors.message} isRequired>
                      <FormLabel>お問い合わせ内容</FormLabel>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="具体的な内容をご記入ください"
                        rows={6}
                      />
                      {errors.message && <FormErrorMessage>{errors.message}</FormErrorMessage>}
                    </FormControl>

                    <Button
                      mt={4}
                      colorScheme="blue"
                      type="submit"
                      isLoading={isSubmitting}
                      loadingText="送信中..."
                      width="full"
                    >
                      送信する
                    </Button>
                  </VStack>
                </form>
              )}
            </VStack>

            <VStack align="stretch" spacing={6}>
              <Box
                bg={bgColor}
                p={8}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="md"
              >
                <Heading as="h2" size="md" mb={4}>お問い合わせ先情報</Heading>
                <VStack spacing={4} align="stretch">
                  <HStack>
                    <Flex
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg="blue.100"
                    >
                      <Icon as={FaEnvelope} color="blue.500" />
                    </Flex>
                    <Box>
                      <Text fontWeight="bold">メール</Text>
                      <Text>support@discord-shop.example.com</Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Flex
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg="blue.100"
                    >
                      <Icon as={FaPhone} color="blue.500" />
                    </Flex>
                    <Box>
                      <Text fontWeight="bold">電話</Text>
                      <Text>03-1234-5678（平日 10:00〜18:00）</Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Flex
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg="blue.100"
                    >
                      <Icon as={FaMapMarkerAlt} color="blue.500" />
                    </Flex>
                    <Box>
                      <Text fontWeight="bold">所在地</Text>
                      <Text>〒107-0062 東京都港区南青山1-2-3 ディスコードビル5F</Text>
                    </Box>
                  </HStack>
                </VStack>
              </Box>

              <Box
                bg={bgColor}
                p={8}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="md"
              >
                <Heading as="h2" size="md" mb={4}>よくあるお問い合わせ</Heading>
                <Text mb={4}>以下のよくある質問もご確認ください：</Text>
                <VStack spacing={2} align="stretch">
                  <Button variant="ghost" justifyContent="flex-start" as="a" href="/faq#purchase">
                    購入方法について
                  </Button>
                  <Divider />
                  <Button variant="ghost" justifyContent="flex-start" as="a" href="/faq#payment">
                    支払い方法について
                  </Button>
                  <Divider />
                  <Button variant="ghost" justifyContent="flex-start" as="a" href="/faq#download">
                    ダウンロード方法について
                  </Button>
                  <Divider />
                  <Button variant="ghost" justifyContent="flex-start" as="a" href="/faq#refund">
                    返金ポリシーについて
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>
    </Layout>
  );
};

export default ContactPage; 