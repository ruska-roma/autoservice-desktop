import { Badge, Button, Flex, Stack, type StackProps, Text } from '@chakra-ui/react';
import { PiCaretLeft } from 'react-icons/pi';

import { type AccountType } from '@/entities';
import { getFormattedAccountData } from '@/entities/account/lib';

interface IAccountHeaderProps {
  data: AccountType;
  containerProps?: StackProps;
  onBackClick: () => void;
}

export const AccountHeader = ({ data, containerProps, onBackClick }: IAccountHeaderProps) => {
  return (
    <Stack
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex px={5} py={4} direction="row" align="center" justify="space-between" gapX={5}>
        <Button size="md" variant="outline" rounded="lg" onClick={onBackClick}>
          <PiCaretLeft />
          Назад
        </Button>
        <Text
          fontSize="clamp(1.25rem, 2.5vw, 1.5rem)"
          textAlign="center"
          fontWeight="medium"
          maxW="475px"
        >
          Счет {getFormattedAccountData(data, 'от')}
        </Text>
        <Badge colorPalette="blue" size="lg">
          #{data.id_account}
        </Badge>
      </Flex>
    </Stack>
  );
};
