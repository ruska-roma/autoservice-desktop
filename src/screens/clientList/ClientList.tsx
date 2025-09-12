import {
  CloseButton,
  createListCollection,
  Flex,
  Grid,
  Input,
  InputGroup,
  Portal,
  Select,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  CLIENT_SEARCH_FIELDS,
  CLIENT_TABLE_COLUMNS,
  type ClientType,
  getClientsCount,
  getClientsList,
  searchClients,
  searchClientsCount,
} from '@/entities';
import { CreateClient } from '@/features';
import { DEFAULT_TABLE_PAGE_SIZE, SCREENS } from '@/shared/config';
import { useDebounceValue, useScreenPersistence } from '@/shared/lib';
import { Container, Pagination } from '@/shared/ui';

export function ClientList() {
  const navigate = useNavigate();
  const { stateRef, save } = useScreenPersistence(SCREENS.ClientList);

  const tableRef = useRef<HTMLDivElement | null>(null);

  const [count, setCount] = useState(0);
  const [clients, setClients] = useState<ClientType[]>([]);

  const [page, setPage] = useState(stateRef.current.page ?? 1);
  const offset = (page - 1) * DEFAULT_TABLE_PAGE_SIZE;

  const [searchQuery, setSearchQuery] = useState(stateRef.current.searchQuery ?? '');
  const [selectedSearchField, setSelectedSearchField] = useState(
    stateRef.current.selectedField ?? CLIENT_SEARCH_FIELDS[0].key,
  );
  const debouncedQuery = useDebounceValue(searchQuery, 300);
  const isSearchMode = debouncedQuery.trim().length > 0;

  useEffect(() => {
    stateRef.current.page = page;
    stateRef.current.offset = (page - 1) * DEFAULT_TABLE_PAGE_SIZE;
  }, [page, stateRef]);

  useEffect(() => {
    stateRef.current.searchQuery = searchQuery;
  }, [searchQuery, stateRef]);

  useEffect(() => {
    stateRef.current.selectedField = selectedSearchField;
  }, [selectedSearchField, stateRef]);

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [page, debouncedQuery, selectedSearchField]);

  useEffect(() => {
    if (isSearchMode) {
      return;
    }

    Promise.all([
      getClientsList({ limit: DEFAULT_TABLE_PAGE_SIZE, offset }),
      getClientsCount(),
    ]).then(([data, total]) => {
      setClients(data ?? []);
      setCount(total ?? 0);
    });
  }, [offset, isSearchMode]);

  useEffect(() => {
    if (!isSearchMode) {
      return;
    }

    let isCurrent = true;

    Promise.all([
      searchClients({
        field: selectedSearchField,
        query: debouncedQuery,
        limit: DEFAULT_TABLE_PAGE_SIZE,
        offset: offset,
      }),
      searchClientsCount({ field: selectedSearchField, query: debouncedQuery }),
    ]).then(([data, total]) => {
      if (!isCurrent) {
        return;
      }
      setClients(data ?? []);
      setCount(total ?? 0);
    });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, selectedSearchField, offset, isSearchMode]);

  const handleSelectChange = useCallback(
    ({ value }: { value: string[] }) => {
      const selected = Array.isArray(value) ? value[0] : value;
      if (isSearchMode) {
        setPage(1);
      }
      setSearchQuery('');
      setSelectedSearchField(selected);
    },
    [isSearchMode],
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setSearchQuery(e.target.value);
  }, []);

  const handleTableItemClick = (id: number) => {
    save();
    navigate(`/client/${id}`, { state: { fromPage: SCREENS.ClientList } });
  };

  const searchFields = useMemo(
    () =>
      createListCollection({
        items: CLIENT_SEARCH_FIELDS.map((field) => ({
          label: field.label,
          value: field.key,
        })),
      }),
    [],
  );

  const searchFieldPlaceholder = useMemo(() => {
    const selectedField = CLIENT_SEARCH_FIELDS.find((f) => f.key === selectedSearchField);
    return selectedField ? `Поиск по полю "${selectedField.label}"` : 'Поиск';
  }, [selectedSearchField]);

  const searchFieldCloseButton = searchQuery ? (
    <CloseButton
      size="xs"
      onClick={() => {
        setSearchQuery('');
        setPage(1);
      }}
      me="-2"
    />
  ) : undefined;

  const isDataEmpty = !isSearchMode && !clients.length && count === 0;

  return (
    <Container>
      <Stack p={3} mb={5} flexShrink={0} backgroundColor="white" rounded="xl">
        <Grid templateColumns="150px 1fr" gap={3}>
          <Select.Root
            disabled={isDataEmpty}
            collection={searchFields}
            value={[selectedSearchField]}
            onValueChange={handleSelectChange}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger rounded="lg">
                <Select.ValueText placeholder="Выберите поле для поиска..." />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content rounded="lg">
                  {searchFields.items.map((field) => (
                    <Select.Item item={field} key={field.value} rounded="md">
                      {field.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          <InputGroup endElement={searchFieldCloseButton}>
            <Input
              rounded="lg"
              outline="none"
              placeholder={searchFieldPlaceholder}
              value={searchQuery}
              disabled={isDataEmpty}
              onChange={handleSearch}
            />
          </InputGroup>
        </Grid>
      </Stack>

      <Stack backgroundColor="white" rounded="xl" overflow="hidden" gap={0} flex="1" minH={0}>
        <Flex
          px={5}
          py={4}
          align="center"
          direction="row"
          justify="space-between"
          borderBottomWidth="1px"
        >
          <Flex direction="column">
            <Text textStyle="3xl" fontWeight="medium">
              Клиенты
            </Text>
            <Text textStyle="md" color="gray.500">
              {isSearchMode ? `Результаты поиска: ${count}` : `Всего записей: ${count}`}
            </Text>
          </Flex>
          <CreateClient />
        </Flex>
        <Table.ScrollArea ref={tableRef} flex="1" w="full" overflow="auto">
          <Table.Root size="md" stickyHeader interactive>
            <Table.Header>
              <Table.Row bg="gray.100">
                {CLIENT_TABLE_COLUMNS.map((col) => (
                  <Table.ColumnHeader key={col.key} textAlign="start">
                    {col.label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {clients.map((client) => (
                <Table.Row
                  cursor="pointer"
                  key={client.id_client}
                  onDoubleClick={() => handleTableItemClick(client.id_client)}
                >
                  {CLIENT_TABLE_COLUMNS.map((col) => (
                    <Table.Cell
                      key={col.key}
                      textAlign="start"
                      wordBreak="normal"
                      whiteSpace="normal"
                    >
                      {client[col.key] ?? '-'}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
        <Flex p={5} flexShrink={0} justify="center" borderTopWidth="1px">
          <Pagination
            size="sm"
            rootProps={{
              page,
              count,
              pageSize: DEFAULT_TABLE_PAGE_SIZE,
              onPageChange: ({ page }) => setPage(page),
            }}
          />
        </Flex>
      </Stack>
    </Container>
  );
}
