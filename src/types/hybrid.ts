export interface IHybridUser {
  Id: number;
  Name: string;
  Username: string;
  Organization: {
    Id: number;
    Inn: string;
    Name: string;
    Address: string;
    AccountNumber: string;
    Mfo: string;
    CreatedOn: Date;
    VatRegCode: string;
    BranchCode: string;
    BranchName: string;
    IsLtd: boolean;
    Pinfl: string;
    CreatedOnStr: string;
    ContractNumber: string;
    ContractDateFrom: Date;
    ContractDateFromStr: string;
    ContractDateTo: Date;
    ContractDateToStr: string;
    ContractorSignerUnitName: string;
    ContractorSignerUnitId: number;
    ContractSum: number;
    SumForMail: number;
    SumForOverPaged: number;
    IsActive: boolean;
    IsDeleted: boolean;
    UnitsCount: number;
    PhoneNumber: string;
    IsNotified: boolean;
    NotifiedOn: null | Date;
    HasContractWithGlobalUnit: boolean;
  };
  Unit: {
    Id: number;
    Name: string;
    Organization: {
      Id: number;
      Inn: string;
      Name: string;
      Address: string;
      AccountNumber: string;
      Mfo: string;
      CreatedOn: Date;
      VatRegCode: string;
      BranchCode: string;
      BranchName: string;
      IsLtd: boolean;
      Pinfl: string;
      CreatedOnStr: string;
      ContractNumber: string;
      ContractDateFrom: Date;
      ContractDateFromStr: string;
      ContractDateTo: Date;
      ContractDateToStr: string;
      ContractorSignerUnitName: string;
      ContractorSignerUnitId: number;
      ContractSum: number;
      SumForMail: number;
      SumForOverPaged: number;
      IsActive: boolean;
      IsDeleted: boolean;
      UnitsCount: number;
      PhoneNumber: string;
      IsNotified: boolean;
      NotifiedOn: null | Date;
      HasContractWithGlobalUnit: boolean;
    };
    IsHead: boolean;
    Address: string;
    CreatedOn: Date;
    ContractNumber: string;
    ContractDateFrom: null | Date;
    ContractDateFromStr: null | string;
    ContractDateTo: null | Date;
    ContractDateToStr: null | string;
    ContractSum: number;
    SumForMail: number;
    SumForOverPaged: number;
    IsActive: boolean;
    CreatedOnStr: string;
    Regions: Array<{
      Id: number;
      Name: string;
    }>;
  };
  Type: number;
  CanSignOnBehalfOfOrganization: boolean;
}

export interface IPdfMail {
  Id: number;
  Receiver: string;
  Address: string;
  Area: {
    Id: number;
    Name: string;
    Region: null | {
      Id: number;
      Name: string;
    };
  };
  Region: {
    Id: number;
    Name: string;
  };
  PagesCount: number;
  IsSent: boolean;
  IsDeleted: boolean;
  SentOn: null | Date;
  SentOnStr: null | string;
  CreatedOn: Date;
  CreatedOnStr: string;
  CreatorUser: IHybridUser;
  SenderUser: null | IHybridUser;
  Perform: null | IHybridUser;
}
