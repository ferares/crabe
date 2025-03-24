import { getRequestConfig } from "next-intl/server"

import { defaultLocale, type LocaleOption, locales } from "./routing"

type DotPrefix<T extends string, U extends string> = `${T}.${U}`

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string)]: ObjectType[Key] extends object ? DotPrefix<Key & string, NestedKeyOf<ObjectType[Key]>> : Key
}[keyof ObjectType & (string)]

export type TranslationKey = NestedKeyOf<IntlMessages>

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if ((!locale) || (!locales.includes(locale as LocaleOption))) locale = defaultLocale
  const messages = (await import(`../../langs/${locale}.json`)) as { default: IntlMessages }
  return { locale, messages: messages.default }
})