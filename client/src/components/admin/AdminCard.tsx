import React, { ReactNode } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  useColorModeValue,
  BoxProps,
  Icon
} from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface AdminCardProps extends BoxProps {
  title: string;
  description?: string;
  icon?: IconType;
  iconColor?: string;
  children: ReactNode;
  action?: ReactNode;
  noPadding?: boolean;
}

/**
 * 管理画面で使用する統一されたカードコンポーネント
 */
export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  description,
  icon,
  iconColor = 'cyan.500',
  children,
  action,
  noPadding = false,
  ...rest
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      boxShadow="sm"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md' }}
      {...rest}
    >
      <Flex 
        p={5} 
        borderBottomWidth={description || noPadding ? "1px" : "0"}
        borderColor={borderColor}
        justify="space-between"
        align="center"
      >
        <Flex align="center">
          {icon && (
            <Icon 
              as={icon} 
              mr={3} 
              boxSize="24px" 
              color={iconColor}
            />
          )}
          <Box>
            <Heading size="md" fontWeight="semibold">
              {title}
            </Heading>
            {description && (
              <Text mt={1} fontSize="sm" color={textColor}>
                {description}
              </Text>
            )}
          </Box>
        </Flex>
        {action && (
          <Box>
            {action}
          </Box>
        )}
      </Flex>
      <Box p={noPadding ? 0 : 5}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminCard; 