import { useEffect, useState } from 'react';
import { 
  Box, Flex, Text, IconButton, Button, Stack, Collapse,
  Popover, PopoverTrigger, PopoverContent, useColorModeValue,
  useBreakpointValue, useDisclosure, Avatar, Menu, MenuButton,
  MenuList, MenuItem, MenuDivider, useColorMode, useToast,
  Icon, Container, Link as ChakraLink
} from '@chakra-ui/react';
import {
  HamburgerIcon, CloseIcon, ChevronDownIcon, ChevronRightIcon
} from '@chakra-ui/icons';
import { FaShoppingCart, FaMoon, FaSun } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthStatus } from './AuthStatus';
import NextLink from 'next/link';

// ナビゲーションアイテムの型定義
interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

// ナビゲーションアイテムの定義
const NAV_ITEMS: Array<NavItem> = [
  {
    label: '商品',
    href: '/products',
  },
  {
    label: 'カテゴリー',
    href: '/categories',
  },
  {
    label: 'サポート',
    href: '/support',
  },
];

// ロゴコンポーネント
const Logo = () => {
  const router = useRouter();
  return (
    <Box
      cursor="pointer"
      fontWeight="bold"
      fontSize="xl"
      color={useColorModeValue('gray.800', 'white')}
      onClick={() => router.push('/')}
    >
      Discord Shop
    </Box>
  );
};

// ナビゲーションアイテム
const NavItem = ({ children, href, ...rest }: any) => {
  const router = useRouter();
  return (
    <Box
      py={2}
      px={3}
      rounded={'md'}
      cursor={'pointer'}
      onClick={() => router.push(href)}
      _hover={{
        bg: useColorModeValue('gray.100', 'gray.700'),
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

const Header = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const HeaderRight = () => {
    return (
      <Stack direction={'row'} spacing={3}>
        <AuthStatus />

        <IconButton
          aria-label="Toggle Color Mode"
          icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
          onClick={toggleColorMode}
          variant="ghost"
          size="sm"
        />

        <IconButton
          aria-label="Shopping Cart"
          icon={<FaShoppingCart />}
          variant="ghost"
          size="sm"
          onClick={() => router.push('/cart')}
        />
      </Stack>
    );
  };

  return (
    <Box
      position="sticky"
      top="0"
      zIndex="sticky"
      bg={useColorModeValue('white', 'gray.800')}
      borderBottom={1}
      borderBottomWidth={scrolled ? '1px' : '0'}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      shadow={scrolled ? 'sm' : 'none'}
      transition={'all 0.3s ease'}
    >
      <Container maxW="container.xl">
        <Flex
          minH={'60px'}
          py={{ base: 2 }}
          align={'center'}
          justify={'space-between'}
        >
          <Flex
            flex={{ base: 1, md: 'auto' }}
            ml={{ base: -2 }}
            display={{ base: 'flex', md: 'none' }}
          >
            <IconButton
              onClick={onToggle}
              icon={
                isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
              }
              variant={'ghost'}
              aria-label={'Toggle Navigation'}
            />
          </Flex>
          
          <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
            <Logo />
            
            <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
              <Stack direction={'row'} spacing={4}>
                <NavItem href="/products">商品</NavItem>
                <NavItem href="/categories">カテゴリー</NavItem>
                <NavItem href="/support">サポート</NavItem>
              </Stack>
            </Flex>
          </Flex>

          <HeaderRight />
        </Flex>

        <Collapse in={isOpen} animateOpacity>
          <Stack
            mt={2}
            pb={4}
            display={{ md: 'none' }}
            spacing={4}
          >
            <NavItem href="/products">商品</NavItem>
            <NavItem href="/categories">カテゴリー</NavItem>
            <NavItem href="/support">サポート</NavItem>
          </Stack>
        </Collapse>
      </Container>
    </Box>
  );
};

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');
  const router = useRouter();

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Box
                p={2}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
                onClick={() => navItem.href && router.push(navItem.href)}
                cursor="pointer"
              >
                {navItem.label}
              </Box>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  const router = useRouter();
  
  return (
    <Box
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('blue.50', 'gray.900') }}
      cursor="pointer"
      onClick={() => href && router.push(href)}
    >
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'blue.400' }}
            fontWeight={500}
          >
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}
        >
          <Icon color={'blue.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Box>
  );
};

const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
      <Box py={2}>
        <AuthStatus />
      </Box>
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Flex
        py={2}
        justify={'space-between'}
        align={'center'}
        onClick={() => href && router.push(href)}
        cursor={href ? 'pointer' : 'default'}
        _hover={{
          textDecoration: 'none',
        }}
      >
        <Text
          fontWeight={600}
          color={useColorModeValue('gray.600', 'gray.200')}
        >
          {label}
        </Text>
        {children && (
          <Icon
            as={ChevronDownIcon}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </Flex>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}
        >
          {children &&
            children.map((child) => (
              <Box 
                key={child.label} 
                py={2} 
                onClick={() => child.href && router.push(child.href)}
                cursor={child.href ? 'pointer' : 'default'}
              >
                {child.label}
              </Box>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

export default Header; 