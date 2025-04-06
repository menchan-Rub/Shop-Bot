import React, { ReactNode } from 'react';
import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Icon,
  Text,
  Tooltip
} from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  helpText?: string;
  change?: number;
  changeLabel?: string;
  bgGradient?: boolean;
  isLoading?: boolean;
  tooltip?: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  helpText,
  change,
  changeLabel,
  bgGradient = false,
  isLoading = false,
  tooltip
}: DashboardCardProps) {
  // カードの背景色と影
  const bgColor = useColorModeValue('white', 'gray.700');
  const iconBg = useColorModeValue('brand.500', 'brand.200');
  const iconColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const statColor = useColorModeValue('brand.600', 'brand.100');
  
  // トレンドの色設定
  const trendUpColor = useColorModeValue('green.500', 'green.300');
  const trendDownColor = useColorModeValue('red.500', 'red.300');
  
  // グラデーション背景を使用する場合
  const gradient = bgGradient 
    ? `linear(to-r, brand.400, brand.600)` 
    : undefined;
  
  // グラデーション使用時の色設定
  const gradientTextColor = bgGradient ? 'white' : textColor;
  const gradientIconBg = bgGradient ? 'white' : iconBg;
  const gradientIconColor = bgGradient ? 'brand.500' : iconColor;

  // トレンド表示のロジック
  const renderTrend = () => {
    if (change === undefined) return null;
    
    const isPositive = change >= 0;
    const color = isPositive ? trendUpColor : trendDownColor;
    const icon = isPositive ? FiTrendingUp : FiTrendingDown;
    const displayChange = Math.abs(change);
    
    return (
      <Flex alignItems="center">
        <Icon as={icon} color={color} mr={1} />
        <Text color={color} fontSize="sm" fontWeight="medium">
          {displayChange}%
        </Text>
        {changeLabel && (
          <Text fontSize="sm" ml={1} color={bgGradient ? 'whiteAlpha.800' : 'gray.500'}>
            {changeLabel}
          </Text>
        )}
      </Flex>
    );
  };

  return (
    <Tooltip label={tooltip} isDisabled={!tooltip} hasArrow placement="top">
      <Stat
        px={4}
        py={5}
        bg={bgColor}
        bgGradient={gradient}
        rounded="lg"
        borderWidth={bgGradient ? 0 : 1}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        shadow="md"
        transition="transform 0.3s, box-shadow 0.3s"
        _hover={{
          transform: 'translateY(-2px)',
          shadow: 'lg',
        }}
      >
        <Flex justifyContent="space-between">
          <Box pl={2}>
            <StatLabel 
              fontWeight="medium" 
              isTruncated 
              color={bgGradient ? 'whiteAlpha.800' : 'gray.500'}
              fontSize="sm"
            >
              {title}
            </StatLabel>
            <StatNumber 
              fontSize="2xl" 
              fontWeight="bold" 
              color={bgGradient ? 'white' : statColor}
              mt={1}
            >
              {isLoading ? "読み込み中..." : value}
            </StatNumber>
            
            {(helpText || change !== undefined) && (
              <StatHelpText mb={0} color={gradientTextColor}>
                {helpText && (
                  <Text fontSize="sm" color={bgGradient ? 'whiteAlpha.800' : 'gray.500'}>
                    {helpText}
                  </Text>
                )}
                {renderTrend()}
              </StatHelpText>
            )}
          </Box>
          
          <Box
            my="auto"
            color={gradientIconColor}
            bg={gradientIconBg}
            p={2}
            alignContent="center"
            borderRadius="full"
          >
            <Icon 
              boxSize={6} 
              as={icon} 
            />
          </Box>
        </Flex>
      </Stat>
    </Tooltip>
  );
} 