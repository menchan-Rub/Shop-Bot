import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { useSession } from 'next-auth/react';
import {
  Container,
  VStack,
  Heading,
  Text,
  Image,
  Badge,
  HStack,
  Divider,
  useColorModeValue,
  Card,
  CardBody,
  SimpleGrid,
  Code,
  Box,
} from '@chakra-ui/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (status === 'loading') {
    return (
      <Container maxW="container.md" py={8}>
        <Text>読み込み中...</Text>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading as="h1" size="xl">プロフィール</Heading>
          <Text>プロフィールを表示するにはログインしてください。</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">プロフィール</Heading>

        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} boxShadow="md">
          <CardBody>
            <VStack spacing={6} align="center">
              <Image
                borderRadius="full"
                boxSize="150px"
                src={session.user.image || 'https://via.placeholder.com/150'}
                alt={session.user.name || 'ユーザー'}
                fallbackSrc="https://via.placeholder.com/150"
              />
              <VStack spacing={2} align="center">
                <Heading as="h2" size="lg">{session.user.name}</Heading>
                <Text color="gray.500">{session.user.email}</Text>
                <HStack spacing={2} mt={2}>
                  {session.user.isAdmin ? (
                    <Badge colorScheme="red">管理者</Badge>
                  ) : (
                    <Badge colorScheme="blue">一般ユーザー</Badge>
                  )}
                </HStack>
              </VStack>
            </VStack>
            
            <Divider my={6} />
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={2}>ユーザーID:</Text>
                <Code p={2} borderRadius="md" fontSize="sm" width="100%">
                  {session.user.id}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>アカウントタイプ:</Text>
                <Text>{session.user.isAdmin ? '管理者アカウント' : '一般アカウント'}</Text>
              </Box>
            </SimpleGrid>
            
            <Box mt={6}>
              <Text fontWeight="bold" mb={2}>環境変数の管理者ID:</Text>
              <Code p={2} borderRadius="md" fontSize="sm" width="100%">
                {process.env.NEXT_PUBLIC_ADMIN_USER_IDS || 'Not available on client side'}
              </Code>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
} 