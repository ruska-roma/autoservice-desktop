import { Flex, Stack, type StackProps, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';

import { type AccountType, deleteAccount } from '@/entities';
import { SubmitButton } from '@/features';
import { SCREENS } from '@/shared/config';
import { toaster } from '@/shared/ui';

interface IDeleteAccountProps {
  data: AccountType;
  containerProps?: StackProps;
}

export const DeleteAccount = ({ data, containerProps }: IDeleteAccountProps) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    const result = await deleteAccount(data.id_account);
    if (result?.success) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись счета успешно удалена',
      });
      navigate(SCREENS.AccountList);
    }
  };

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
        borderBottomWidth="1px"
      >
        <Text textStyle="xl" fontWeight="medium">
          Удаление счета
        </Text>
      </Flex>
      <Flex direction="column" px={5} py={4} gap={3}>
        <Text textStyle="md" color="gray.500" maxW={900}>
          Внимание! Данное действие приведет к удалению всех данных, связанных со счетом. Будут
          удалены все работы, проведенные в рамках счета, а также используемые запчасти.
        </Text>
        <Stack w="fit">
          <SubmitButton colorPalette="red" onConfirm={handleDelete}>
            Удалить запись счета
          </SubmitButton>
        </Stack>
      </Flex>
    </Stack>
  );
};
