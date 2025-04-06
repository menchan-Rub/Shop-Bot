import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
  useToast,
  Flex,
  Divider,
  Spinner,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import ProfileForm from '../../components/profile/ProfileForm';
import SecuritySettings from '../../components/profile/SecuritySettings';
import OrderHistory from '../../components/profile/OrderHistory';
import AccountSettings from '../../components/profile/AccountSettings';
import { FaUser, FaShieldAlt, FaHistory, FaCog } from 'react-icons/fa';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const toast = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [tabIndex, setTabIndex] = useState(0);

  // プロフィールデータを取得
  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );

      setProfile(response.data);
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      setError('プロフィールの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchProfileData();
    } else if (status === 'unauthenticated') {
      // 未認証の場合はログインページにリダイレクト
      window.location.href = '/auth/signin';
    }
  }, [session, status]);

  // 日付のフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (status === 'loading' || isLoading) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" py={10}>
        <Box p={5} bg="red.50" color="red.800" borderRadius="md">
          <Heading size="md" mb={2}>エラーが発生しました</Heading>
          <Text>{error}</Text>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>プロフィール | Shop</title>
      </Head>

      <Container maxW="container.lg" py={8}>
        <Box mb={8}>
          <Heading as="h1" size="xl" mb={2}>マイアカウント</Heading>
          <Text color="gray.500">
            アカウント情報の管理、注文履歴の確認、セキュリティ設定の変更ができます。
          </Text>
        </Box>

        {profile && (
          <>
            {/* ユーザー情報サマリー */}
            <Box
              p={6}
              mb={8}
              bg={bgColor}
              borderRadius="lg"
              boxShadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack spacing={6} align="start">
                <Avatar
                  size="xl"
                  name={profile.username}
                  src={profile.avatar || undefined}
                />
                <VStack align="start" spacing={1} flex={1}>
                  <Heading as="h2" size="lg">{profile.username}</Heading>
                  <Text>{profile.email}</Text>
                  {profile.emailVerified ? (
                    <Badge colorScheme="green">メール認証済み</Badge>
                  ) : (
                    <Badge colorScheme="yellow">メール未認証</Badge>
                  )}
                  <Divider my={2} />
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} width="100%">
                    <Stat bg={cardBg} p={3} borderRadius="md">
                      <StatLabel>会員ステータス</StatLabel>
                      <StatNumber>
                        {profile.membershipLevel || '一般会員'}
                      </StatNumber>
                    </Stat>
                    <Stat bg={cardBg} p={3} borderRadius="md">
                      <StatLabel>ポイント残高</StatLabel>
                      <StatNumber>
                        {profile.points || 0} pt
                      </StatNumber>
                    </Stat>
                    <Stat bg={cardBg} p={3} borderRadius="md">
                      <StatLabel>最終ログイン</StatLabel>
                      <StatHelpText>
                        {formatDate(profile.lastLogin)}
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </VStack>
              </HStack>
            </Box>

            {/* タブ付きコンテンツ */}
            <Tabs
              variant="soft-rounded"
              colorScheme="blue"
              index={tabIndex}
              onChange={setTabIndex}
            >
              <TabList mb={6} overflowX="auto" flexWrap={{ base: 'nowrap', md: 'wrap' }}>
                <Tab><HStack><FaUser /><Text>プロフィール</Text></HStack></Tab>
                <Tab><HStack><FaShieldAlt /><Text>セキュリティ</Text></HStack></Tab>
                <Tab><HStack><FaHistory /><Text>注文履歴</Text></HStack></Tab>
                <Tab><HStack><FaCog /><Text>アカウント設定</Text></HStack></Tab>
              </TabList>

              <TabPanels>
                {/* プロフィール編集 */}
                <TabPanel>
                  <Box
                    p={6}
                    bg={bgColor}
                    borderRadius="lg"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <ProfileForm profile={profile} onUpdate={fetchProfileData} />
                  </Box>
                </TabPanel>

                {/* セキュリティ設定 */}
                <TabPanel>
                  <Box
                    p={6}
                    bg={bgColor}
                    borderRadius="lg"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <SecuritySettings />
                  </Box>
                </TabPanel>

                {/* 注文履歴 */}
                <TabPanel>
                  <Box
                    p={6}
                    bg={bgColor}
                    borderRadius="lg"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <OrderHistory />
                  </Box>
                </TabPanel>

                {/* アカウント設定 */}
                <TabPanel>
                  <Box
                    p={6}
                    bg={bgColor}
                    borderRadius="lg"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <AccountSettings />
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        )}
      </Container>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?error=Unauthorized',
        permanent: false,
      }
    };
  }

  return {
    props: {}
  };
}; 