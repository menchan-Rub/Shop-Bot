import { extendTheme } from '@chakra-ui/react';

// 水色と白を基調としたカスタムカラースキーム
const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e3ff',
    200: '#80cfff',
    300: '#4dbbff',
    400: '#1aa7ff',
    500: '#0099ff', // メインの水色
    600: '#007acc',
    700: '#005c99',
    800: '#003d66',
    900: '#001f33',
  },
  accent: {
    50: '#e6f9ff',
    100: '#b3edff',
    200: '#80e1ff',
    300: '#4dd5ff',
    400: '#1ac9ff',
    500: '#00bfff', // アクセントの水色
    600: '#0099cc',
    700: '#007399',
    800: '#004d66',
    900: '#002633',
  },
  // ニュートラルカラー
  neutral: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    800: '#1a202c',
    900: '#171923',
  },
};

// カスタムコンポーネントスタイル
const components = {
  Button: {
    // ボタンのバリアントをカスタマイズ
    variants: {
      primary: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.300',
          },
        },
        _active: {
          bg: 'brand.700',
        },
      },
      secondary: {
        bg: 'white',
        color: 'brand.500',
        border: '1px solid',
        borderColor: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
        _active: {
          bg: 'brand.100',
        },
      },
      accent: {
        bg: 'accent.500',
        color: 'white',
        _hover: {
          bg: 'accent.600',
        },
        _active: {
          bg: 'accent.700',
        },
      },
    },
    // デフォルトプロパティ
    defaultProps: {
      variant: 'primary',
    },
  },
  Badge: {
    variants: {
      available: {
        bg: 'green.100',
        color: 'green.800',
      },
      outOfStock: {
        bg: 'red.100',
        color: 'red.800',
      },
      hidden: {
        bg: 'gray.100',
        color: 'gray.800',
      },
      lowStock: {
        bg: 'orange.100',
        color: 'orange.800',
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'md',
        overflow: 'hidden',
      },
      body: {
        padding: '4',
      },
      header: {
        padding: '4',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
      },
      footer: {
        padding: '4',
        borderTop: '1px solid',
        borderColor: 'gray.200',
      },
    },
    variants: {
      elevated: {
        container: {
          boxShadow: 'lg',
          _hover: {
            boxShadow: 'xl',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      outline: {
        container: {
          border: '1px solid',
          borderColor: 'gray.200',
          boxShadow: 'none',
        },
      },
      branded: {
        container: {
          bg: 'brand.50',
          border: '1px solid',
          borderColor: 'brand.200',
        },
        header: {
          bg: 'brand.500',
          color: 'white',
          borderBottom: 'none',
        },
      },
    },
  },
  Table: {
    variants: {
      simple: {
        th: {
          bg: 'brand.50',
          color: 'brand.800',
          borderBottom: '2px solid',
          borderColor: 'brand.200',
          fontSize: 'sm',
          fontWeight: 'semibold',
        },
        td: {
          borderBottom: '1px solid',
          borderColor: 'gray.200',
        },
        tr: {
          _hover: {
            bg: 'brand.50',
          },
        },
        tbody: {
          tr: {
            '&:last-of-type': {
              td: {
                borderBottom: 'none',
              },
            },
          },
        },
      },
    },
  },
};

// グローバルスタイル
const styles = {
  global: {
    body: {
      bg: 'white',
      color: 'gray.800',
    },
  },
};

// テーマ設定
const theme = extendTheme({
  colors,
  components,
  styles,
  fonts: {
    heading: '"Noto Sans JP", sans-serif',
    body: '"Noto Sans JP", sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme; 