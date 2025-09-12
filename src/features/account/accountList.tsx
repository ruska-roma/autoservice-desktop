import { Flex, Stack, type StackProps, Table, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';

import {
  ACCOUNT_TABLE_COLUMNS,
  type AccountType,
  type AutoType,
  type ExtAccountType,
  type ExtClientType,
} from '@/entities';
import { SCREENS } from '@/shared/config';

import { CreateAccount } from './createAccount';

interface IAccountListProps {
  data: ExtClientType;
  containerProps?: StackProps;
}

export const AccountList = ({ data, containerProps }: IAccountListProps) => {
  const { autos, accounts } = data;

  const navigate = useNavigate();

  const handleTableItemClick = (id: number) => {
    navigate(`/account/${id}`, {
      state: { fromPage: SCREENS.ClientDetails, clientId: data.id_client },
    });
  };

  const extAccounts: ExtAccountType[] = accounts.map((account: AccountType) => {
    const auto = autos.find((a: AutoType) => a.id_auto === account.id_auto);
    return {
      ...account,
      auto_vin: auto?.vin ?? auto?.id_auto.toString() ?? '-',
    };
  });

  const isAutosExist = autos.length > 0;
  const isAccountsExist = extAccounts.length > 0;

  return (
    <Stack
      gap={0}
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex
        px={5}
        py={4}
        align="center"
        direction="row"
        justify="space-between"
        borderBottomWidth={isAccountsExist ? '1px' : undefined}
      >
        <Flex direction="column">
          <Text textStyle="xl" fontWeight="medium">
            Список счетов
          </Text>
          <Text textStyle="md" color="gray.500">
            {isAutosExist
              ? `Всего записей: ${extAccounts.length}`
              : 'У клиента пока нет автомобилей — добавьте авто, чтобы работать со счетами'}
          </Text>
        </Flex>
        {!!isAutosExist && <CreateAccount client={data} />}
      </Flex>
      {!!isAccountsExist && (
        <Table.ScrollArea maxH={500} w="100%">
          <Table.Root size="md" stickyHeader interactive>
            <Table.Header>
              <Table.Row bg="gray.100">
                {ACCOUNT_TABLE_COLUMNS.map((col) => (
                  <Table.ColumnHeader key={col.key} textAlign="start">
                    {col.label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {extAccounts.map((account, index) => {
                const isLast = index === accounts.length - 1;
                return (
                  <Table.Row
                    cursor="pointer"
                    key={account.id_account}
                    onDoubleClick={() => handleTableItemClick(account.id_account)}
                  >
                    {ACCOUNT_TABLE_COLUMNS.map((col) => (
                      <Table.Cell
                        key={col.key}
                        textAlign="start"
                        wordBreak="normal"
                        whiteSpace="normal"
                        borderBottom={isLast ? 0 : undefined}
                      >
                        {account[col.key] ?? '-'}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
    </Stack>
  );
};
