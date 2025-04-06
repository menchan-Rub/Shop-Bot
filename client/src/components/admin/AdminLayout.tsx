import React, { ReactNode } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  useColorModeValue,
  useColorMode,
  Text,
  FlexProps,
  Drawer,
  DrawerContent,
  useDisclosure,
  BoxProps,
  CloseButton,
  VStack,
  Link as ChakraLink,
  Avatar,
  Divider,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
  Icon,
  Button,
  Image,
  MenuDivider
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { 
  FiMenu, 
  FiHome, 
  FiBox, 
  FiUsers, 
  FiShoppingCart, 
  FiSettings, 
  FiLogOut, 
  FiCpu, 
  FiBarChart, 
  FiTag, 
  FiClipboard, 
  FiDatabase, 
  FiLayers, 
  FiBell,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { chakra } from '@chakra-ui/react';
import { IconType } from 'react-icons';

type AdminLayoutProps = {
  children: ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { data: session } = useSession();

  const bg = useColorModeValue('gray.50', 'gray.900');
  const bgNavbar = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box minH="100vh" bg={bg}>
      <Flex
        pos="fixed"
        w="full"
        h="20"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        px={8}
        bg={bgNavbar}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        boxShadow="sm"
        zIndex="1"
      >
        {/* Logo and title */}
        <Flex alignItems="center">
          <Box as="button" onClick={() => router.push('/admin')} display="flex" alignItems="center">
            <Image
              src="/admin-login-icon.svg"
              alt="Admin logo"
              boxSize="40px"
              mr={3}
              fallbackSrc="/admin-login-icon.svg"
            />
            <chakra.h1 fontSize="xl" fontWeight="bold">
              管理者パネル
            </chakra.h1>
          </Box>
        </Flex>

        {/* Right section */}
        <Flex alignItems="center">
          <ColorModeToggle />
          <Menu>
            <MenuButton
              ml={4}
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="outline"
            >
              {session?.user?.name || 'ユーザー'}
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FaUser />} onClick={() => router.push('/profile')}>マイプロフィール</MenuItem>
              <MenuItem icon={<FaCog />} onClick={() => router.push('/admin/settings')}>設定</MenuItem>
              <MenuDivider />
              <MenuItem 
                icon={<FaSignOutAlt />} 
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  signOut({ callbackUrl: '/' });
                }}
              >
                ログアウト
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Flex direction={{ base: 'column', md: 'row' }}>
        <Sidebar
          onClose={() => onClose}
          display={{ base: 'none', md: 'block' }}
          marginTop="80px"
        />
        <Drawer
          isOpen={isOpen}
          placement="left"
          onClose={onClose}
          returnFocusOnClose={false}
          onOverlayClick={onClose}
          size="xs"
        >
          <DrawerContent>
            <MobileNav onClose={onClose} />
          </DrawerContent>
        </Drawer>
        
        <Box ml={{ base: 0, md: 60 }} p={4} mt="80px" w="full">
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const router = useRouter();
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        {/* Logo and title */}
        <Flex alignItems="center">
          <Box as="button" onClick={() => router.push('/admin')} display="flex" alignItems="center">
            <Image
              src="/admin-login-icon.svg"
              alt="Admin logo"
              boxSize="40px"
              mr={3}
              fallbackSrc="/admin-login-icon.svg"
            />
            <chakra.h1 fontSize="xl" fontWeight="bold">
              管理者パネル
            </chakra.h1>
          </Box>
        </Flex>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>

      <Flex direction="column" flex="1" overflowY="auto" pt={5} pb={4}>
        <NavItem path="/admin" icon={FiHome}>
          ダッシュボード
        </NavItem>
        <NavItem path="/admin/products" icon={FiBox}>
          商品管理
        </NavItem>
        <NavItem path="/admin/orders" icon={FiShoppingCart}>
          注文管理
        </NavItem>
        <NavItem path="/admin/users" icon={FiUsers}>
          ユーザー管理
        </NavItem>
        <NavItem path="/admin/categories" icon={FiTag}>
          カテゴリ管理
        </NavItem>
        <NavItem path="/admin/settings" icon={FiSettings}>
          設定
        </NavItem>
      </Flex>
    </Box>
  );
};

// Sidebarコンポーネントを定義
const Sidebar = SidebarContent;

// ナビゲーション項目
interface NavItemProps extends FlexProps {
  icon: IconType;
  path: string;
  children: ReactText;
}

const NavItem = ({ icon, children, path, ...rest }: NavItemProps) => {
  const router = useRouter();
  const pathWithoutAdmin = path.replace('/admin/', '');
  
  // アクティブルートの判定ロジックを修正
  const isActiveRoute = path === '/admin'
    ? router.pathname === '/admin' || router.asPath === '/admin'
    : (router.pathname.includes(path) || 
       (router.asPath.includes(pathWithoutAdmin) && pathWithoutAdmin !== ''));

  const handleClick = () => {
    router.push(path);
  };

  return (
    <Box 
      onClick={handleClick}
      cursor="pointer"
    >
      <Flex
        as="span"
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        bg={isActiveRoute ? 'blue.400' : 'transparent'}
        color={isActiveRoute ? 'white' : 'gray.600'}
        _hover={{
          bg: 'blue.400',
          color: 'white',
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Box>
  );
};

interface MobileProps extends FlexProps {
  onClose: () => void;
}

const MobileNav = ({ onClose, ...rest }: MobileProps) => {
  const { data: session } = useSession();
  
  return (
    <Box>
      <Flex
        px={4}
        height="20"
        alignItems="center"
        bg={useColorModeValue('white', 'gray.900')}
        borderBottomWidth="1px"
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        justifyContent="space-between"
      >
        <HStack spacing={2}>
          <Icon as={FiLayers} color="brand.500" w={6} h={6} />
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            管理パネル
          </Text>
        </HStack>
        <CloseButton onClick={onClose} />
      </Flex>
      
      <Box px={4} py={2}>
        <VStack align="center" py={4} spacing={1}>
          <Avatar 
            size="md" 
            src={session?.user?.image || undefined}
            name={session?.user?.name || 'Admin'}
          />
          <Text fontWeight="medium" fontSize="sm" textAlign="center">
            {session?.user?.name || 'Admin'}
          </Text>
          <Text fontSize="xs" color="gray.500">
            管理者
          </Text>
        </VStack>
        <Divider my={2} />
      </Box>
      
      <VStack spacing={0} align="stretch">
        <SidebarContent onClose={onClose} display={{ base: 'block' }} />
      </VStack>
    </Box>
  );
};

const ColorModeToggle = () => {
  const { toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(FiMoon, FiSun);

  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={<SwitchIcon />}
      variant="ghost"
      onClick={toggleColorMode}
    />
  );
};

export default AdminLayout; 