export type TypeApiMethods = 'get' | 'head' | 'post' | 'put' | 'delete' | 'options' | 'patch'
export type TypeApiTypes = 'static' | 'JavaScript'

export type TypeApi = {
  name: string,
  method: TypeApiMethods,
  type: TypeApiTypes,
  value: string,
}

export const ApiMethodList: TypeApiMethods[] = [
  'get', 'head', 'post', 'put', 'delete', 'options', 'patch',
]

export const ApiTypeList: TypeApiTypes[] = [
  'static',
  'JavaScript',
]
