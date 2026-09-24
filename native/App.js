import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useLocales } from 'expo-localization';
import { catalog } from '../src/catalog.js';
import { filterUnits } from '../src/domain.js';
import { costLabel, dictionaries, resolveLocale, textFor } from '../src/i18n.js';
import { NativeRepository } from './storage.js';
import { nativeCopy } from './copy.js';

// No remote adapter, browser, map, upload or location module is imported here.
const repository = new NativeRepository(AsyncStorage);

function Text({ style, ...props }) {
  return <NativeText {...props} style={[{color:'#182d25'}, style]} />;
}

function Button({ title, onPress, disabled = false, selected = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, selected && styles.selected, (disabled || pressed) && styles.dim]}>
    <Text style={[styles.buttonText, selected && styles.selectedText]}>{title}</Text>
  </Pressable>;
}

export default function App() {
  return <SafeAreaProvider><Client /></SafeAreaProvider>;
}

function Client() {
  const deviceLocale = useLocales()[0]?.languageTag ?? 'en';
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const lock = useRef(false);
  const [page, setPage] = useState('discover');
  const [region, setRegion] = useState(null);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState(null);
  const [original, setOriginal] = useState(false);
  const [saved, setSaved] = useState(false);
  const locale = resolveLocale(state?.preference ?? 'auto', deviceLocale);
  const t = dictionaries[locale];
  const n = nativeCopy[locale];

  async function load() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError(''); setSaved(false);
    try { setState(await repository.load()); }
    catch { setError('loadError'); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (unit) { setUnit(null); return true; }
      if (page !== 'discover') { setPage('discover'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [unit, page]);

  async function setLanguage(preference) {
    if (lock.current || error) return;
    lock.current = true; setBusy(true); setSaved(false);
    try {
      setState(await repository.transact(current => ({ ...current, preference })));
      setSaved(true);
    } catch { setError('storageError'); }
    finally { lock.current = false; setBusy(false); }
  }

  const localized = value => textFor(value, original ? unit.sourceLocale : locale, unit.sourceLocale);
  return <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}><Text accessibilityRole="header" style={styles.brand}>{t.brand}</Text><Text style={styles.muted}>{n.phase}</Text></View>
    {busy && !state ? <View style={styles.card}><ActivityIndicator /><Text>{n.loading}</Text></View> : null}
    {error ? <View style={styles.card}>
      <Text accessibilityRole="alert">{error === 'loadError' ? t.loadError : n.nativeSaveError}</Text>
      <Button title={n.retry} onPress={load} disabled={busy} />
    </View> : null}
    {state ? <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.notice}>{t.demo}</Text>
        {unit ? <View style={styles.card}>
          <Button title={t.back} onPress={() => setUnit(null)} />
          <Text style={styles.badge}>{n.unverified}</Text>
          <Text accessibilityRole="header" style={styles.title}>{localized(unit.title)}</Text>
          <Text>{unit.sourceType === 'ai_draft' ? t.aiDraft : `${t.originalExperience} · ${t.local}`}</Text>
          <Text>{t.author}: {unit.author} · {t.version} {unit.version}</Text>
          <Text style={styles.muted}>{unit.id} / {unit.versionId}</Text>
          <Text>{n.source}: {unit.sourceLocale}</Text>
          <Text>{original || locale === unit.sourceLocale ? t.original : t.translation}</Text>
          {locale !== unit.sourceLocale ? <Button title={original ? t.viewTranslated : t.viewOriginal} onPress={() => setOriginal(!original)} /> : null}
          <Text>{localized(unit.description)}</Text><Text>{localized(unit.place)}</Text>
          <Text>{unit.durationMinutes} {t.minutes} · {costLabel(unit.cost, locale)}</Text>
          <Text style={styles.subtitle}>{t.points}</Text>
          {unit.points.map((point, index) => <Text key={point.id}>{index + 1}. {localized(point.text)}</Text>)}
          <Text style={styles.subtitle}>{t.tip}</Text><Text>{localized(unit.tip)}</Text>
          <Text style={styles.muted}>{n.tripPending}</Text>
        </View> : page === 'discover' ? <>
          <Text accessibilityRole="header" style={styles.title}>{t.intro}</Text>
          <View style={styles.card}><Text style={styles.subtitle}>{n.chooseArea}</Text>
            <Text>{n.oneArea}</Text>
            <Button title={region ? n.changeArea : n.selectArea} onPress={() => { setRegion(region ? null : {country:'KR',city:'seoul',district:'seongsu'}); setQuery(''); }} />
            {region ? <Text>{t.korea} · {t.seoul} · {t.seongsu}</Text> : null}
          </View>
          {region ? <>
            <Text>{t.search}</Text><TextInput accessibilityLabel={t.search} value={query} onChangeText={setQuery} style={styles.input} maxLength={120} />
            {filterUnits(catalog, {query,region}).map(item => <View key={item.versionId} style={styles.card}>
              <Text style={styles.badge}>{n.unverified}</Text>
              <Text style={styles.subtitle}>{textFor(item.title, locale, item.sourceLocale)}</Text>
              <Text>{item.sourceType === 'ai_draft' ? t.aiDraft : `${t.originalExperience} · ${t.local}`}</Text>
              <Text>{item.durationMinutes} {t.minutes} · {costLabel(item.cost, locale)}</Text>
              <Button title={t.detail} onPress={() => {setOriginal(false); setUnit(item);}} />
            </View>)}
            {!filterUnits(catalog, {query,region}).length ? <Text>{t.empty}</Text> : null}
          </> : null}
        </> : page === 'settings' ? <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{t.language}</Text>
          {[['auto', t.automatic], ['ko', '한국어'], ['en', 'English']].map(([value, title]) =>
            <Button key={value} title={title} selected={state.preference === value} disabled={busy || !!error} onPress={() => setLanguage(value)} />)}
          {saved ? <Text accessibilityLiveRegion="polite">{n.savedLanguage}</Text> : null}
          <Text>{t.contentLanguage}</Text>
          <Text style={styles.subtitle}>{t.storageTitle}</Text><Text>{n.nativeStorage}</Text>
          <Text style={styles.subtitle}>{t.privacyTitle}</Text><Text>{t.privacyBody}</Text>
          <Text style={styles.subtitle}>{t.serverTitle}</Text><Text>{t.serverBody}</Text>
        </View> : <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{t[page]}</Text>
          <Text>{page === 'trips' ? n.tripPending : t.writeLater}</Text>
          {page === 'trips' ? <Text>{n.savedTrips}: {state.trips.length}</Text> : null}
          <Text>{n.nativeStorage}</Text>
        </View>}
      </ScrollView>
      <View style={styles.navigation}>{['trips','discover','mine','settings'].map(tab =>
        <Button key={tab} title={t[tab]} selected={page === tab && !unit} onPress={() => {setUnit(null);setPage(tab);setSaved(false);}} />)}</View>
    </> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: {flex:1, backgroundColor:'#f7f5ee'},
  header: {padding:16, gap:4}, brand: {fontSize:24, fontWeight:'700', color:'#164e43'},
  content: {padding:16, gap:16, paddingBottom:32},
  card: {backgroundColor:'#fff', padding:16, borderRadius:16, gap:12},
  title: {fontSize:24, fontWeight:'700', color:'#164e43'},
  subtitle: {fontSize:18, fontWeight:'600', color:'#164e43'},
  muted: {color:'#535b56'}, badge: {color:'#79521a', fontWeight:'600'},
  notice: {color:'#535b56', lineHeight:21},
  input: {borderWidth:1, borderColor:'#6e8076', borderRadius:10, padding:12, minHeight:48, backgroundColor:'#fff', color:'#182d25'},
  button: {minHeight:48, justifyContent:'center', alignItems:'center', padding:12, borderWidth:1, borderColor:'#386657', borderRadius:10},
  buttonText: {color:'#164e43', fontSize:15, textAlign:'center'},
  selected: {backgroundColor:'#164e43'}, selectedText: {color:'#fff'}, dim: {opacity:0.5},
  navigation: {padding:12, flexDirection:'row', flexWrap:'wrap', justifyContent:'space-around', gap:8, borderTopWidth:1, borderTopColor:'#ced7cd'},
});
