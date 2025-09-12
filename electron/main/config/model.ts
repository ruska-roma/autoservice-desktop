export enum TableEnum {
  Client = 't_client',
  Auto = 't_auto',
  Account = 't_account',
  Work = 't_work',
  Part = 't_part',
  Master = 't_master',
  Company = 't_companyessentials',
  Settings = 't_settings',
}

export const primaryKeys = {
  [TableEnum.Client]: 'id_client',
  [TableEnum.Auto]: 'id_auto',
  [TableEnum.Account]: 'id_account',
  [TableEnum.Work]: 'id_work',
  [TableEnum.Part]: 'id_part',
  [TableEnum.Master]: 'id_master',
  [TableEnum.Company]: 'id_companydetails',
  [TableEnum.Settings]: 'id',
};
