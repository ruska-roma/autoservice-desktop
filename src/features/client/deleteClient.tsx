import { Flex, Stack, type StackProps, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';

import { type ClientType, deleteClient } from '@/entities/client';
import { SubmitButton } from '@/features';
import { SCREENS } from '@/shared/config';
import { toaster } from '@/shared/ui/toaster';

interface IDeleteClientProps {
  data: ClientType;
  containerProps?: StackProps;
}

export const DeleteClient = ({ data, containerProps }: IDeleteClientProps) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    const result = await deleteClient(data.id_client);
    if (result?.success) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись клиента успешно удалена',
      });
      navigate(SCREENS.ClientList);
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
          Удаление клиента
        </Text>
      </Flex>
      <Flex direction="column" px={5} py={4} gap={3}>
        <Text textStyle="md" color="gray.500" maxW={900}>
          Внимание! Данное действие приведет к удалению всех данных, связанных с клиентом. Будут
          удалены все автомобили клиента, связанные с ними счета, выполненные работы, а также
          используемые запчасти.
        </Text>
        <Stack w="fit">
          <SubmitButton colorPalette="red" onConfirm={handleDelete}>
            Удалить запись клиента
          </SubmitButton>
        </Stack>
      </Flex>
    </Stack>
  );
};
