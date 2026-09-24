import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StatusBar, StyleSheet, Text as NativeText, TextInput, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useLocales } from 'expo-localization';
import { catalog } from '../src/catalog.js';
import { filterUnits, findConflicts, scheduleEnd, sortedItems, timeOf } from '../src/domain.js';
import { costLabel, dictionaries, resolveLocale, textFor } from '../src/i18n.js';
import { addUnitToTrip, createPrivateTrip, editTripItem, saveExperienceRecord } from './actions.js';
import { beginDraft, changeDraft, hasUnsavedChanges } from './drafts.js';
import { createIdGenerator } from './ids.js';
import { NativeRepository } from './storage.js';
import { nativeCopy } from './copy.js';

// No remote adapter, browser, map, upload or location module is imported here.
const repository = new NativeRepository(AsyncStorage);
const demoRegion = {country:'KR', city:'seoul', district:'seongsu'};

function Text({style, ...props}) {
  return <NativeText {...props} style={[{color:'#182d25'}, style]} />;
}

function Button({title, onPress, disabled = false, selected = false, danger = false}) {
  return <Pressable accessibilityRole="button" accessibilityState={{disabled, selected}}
    disabled={disabled} onPress={onPress}
    style={({pressed}) => [styles.button, selected && styles.selected, danger && styles.danger, (disabled || pressed) && styles.dim]}>
    <Text style={[styles.buttonText, selected && styles.selectedText, danger && styles.dangerText]}>{title}</Text>
  </Pressable>;
}

function Field({label, value, onChangeText, keyboardType = 'default', multiline = false, maxLength = 120}) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} keyboardType={keyboardType}
      multiline={multiline} maxLength={maxLength} style={[styles.input, multiline && styles.noteInput]}
      autoCapitalize="none" autoCorrect={false} />
  </View>;
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
  const ids = useRef(createIdGenerator()).current;
  const pendingLeave = useRef(null);
  const [page, setPage] = useState('discover');
  const [region, setRegion] = useState(null);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState(null);
  const [original, setOriginal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const locale = resolveLocale(state?.preference ?? 'auto', deviceLocale);
  const t = dictionaries[locale];
  const n = nativeCopy[locale];
  const selectedTrip = state?.trips.find(trip => trip.id === selectedTripId) ?? null;
  const editorDirty = hasUnsavedChanges(editor);

  async function load() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const next = await repository.load();
      setState(next);
      if (selectedTripId && !next.trips.some(trip => trip.id === selectedTripId)) setSelectedTripId(null);
    } catch { setError('loadError'); }
    finally { lock.current = false; setBusy(false); }
  }

  function openEditor(kind, draft, context = {}) {
    setEditor(beginDraft(kind, draft, context));
    setFormError(''); setNotice(''); setDiscardPrompt(false);
  }

  function updateDraft(key, value) {
    setEditor(current => current ? changeDraft(current, key, value) : current);
    setFormError(''); setNotice('');
  }

  function finishLeave() {
    const action = pendingLeave.current;
    pendingLeave.current = null;
    setDiscardPrompt(false); setEditor(null); setFormError('');
    action?.();
  }

  function requestLeave(action = null) {
    if (editor && editorDirty) {
      pendingLeave.current = action;
      setDiscardPrompt(true);
      return;
    }
    setEditor(null); setFormError(''); action?.();
  }

  function navigate(tab) {
    requestLeave(() => {
      setUnit(null); setPage(tab); setNotice('');
      if (tab !== 'trips') setSelectedTripId(null);
    });
  }

  async function commit(change, noticeKey, after) {
    if (lock.current || error) return false;
    lock.current = true; setBusy(true); setFormError(''); setNotice('');
    try {
      const next = await repository.transact(change);
      setState(next); setEditor(null); setDiscardPrompt(false); setNotice(noticeKey); after?.();
      return true;
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : 'invalid';
      if (code === 'storageError' || code === 'loadError') setError(code);
      else setFormError(code in t ? code : 'invalid');
      return false;
    } finally { lock.current = false; setBusy(false); }
  }

  async function setLanguage(preference) {
    await commit(current => ({...current, preference}), 'savedLanguage');
  }

  function startTrip() {
    openEditor('trip', {name:'', startDate:'', endDate:''});
  }

  async function saveTrip() {
    const id = ids.next('trip', state.trips.map(trip => trip.id));
    const input = {...editor.draft, region:demoRegion};
    await commit(current => createPrivateTrip(current, input, id), 'tripSaved', () => {
      setPage('trips'); setUnit(null); setSelectedTripId(id);
    });
  }

  function startAddToTrip(targetUnit) {
    if (!state.trips.length) {
      setUnit(null); setPage('trips'); startTrip(); return;
    }
    const trip = state.trips[0];
    openEditor('add', {tripId:trip.id, date:trip.startDate, startTime:'09:00'}, {unit:targetUnit});
  }

  function chooseAddTrip(tripId) {
    const trip = state.trips.find(current => current.id === tripId);
    setEditor(current => ({...current, draft:{...current.draft, tripId, date:trip.startDate}}));
    setFormError('');
  }

  async function saveAddedUnit() {
    const existing = state.trips.flatMap(trip => trip.items.map(item => item.id));
    const itemId = ids.next('item', existing);
    const {tripId, date, startTime} = editor.draft;
    await commit(current => addUnitToTrip(current, tripId, editor.context.unit, {date, startTime}, itemId), 'addSaved', () => {
      setUnit(null); setPage('trips'); setSelectedTripId(tripId);
    });
  }

  function startSchedule(trip, item) {
    openEditor('schedule', {
      date:item.date, startTime:item.startTime, durationMinutes:String(item.durationMinutes),
      movementMinutes:String(item.movementMinutes ?? 0), breakMinutes:String(item.breakMinutes ?? 0),
    }, {tripId:trip.id, itemId:item.id, snapshot:item.snapshot});
  }

  async function saveSchedule() {
    const number = value => /^\d+$/.test(value) ? Number(value) : Number.NaN;
    const patch = {
      date:editor.draft.date, startTime:editor.draft.startTime,
      durationMinutes:number(editor.draft.durationMinutes), movementMinutes:number(editor.draft.movementMinutes),
      breakMinutes:number(editor.draft.breakMinutes),
    };
    await commit(current => editTripItem(current, editor.context.tripId, editor.context.itemId, patch), 'scheduleSaved');
  }

  function startRecord(trip, item) {
    const record = state.records[item.id];
    openEditor('record', {
      checkedIds:record?.checkedIds ?? [], note:record?.note ?? '', skipped:record?.status === 'skipped',
    }, {tripId:trip.id, itemId:item.id, snapshot:item.snapshot});
  }

  function togglePoint(pointId) {
    const checked = editor.draft.checkedIds.includes(pointId);
    const checkedIds = checked ? editor.draft.checkedIds.filter(id => id !== pointId) : [...editor.draft.checkedIds, pointId];
    setEditor(current => ({...current, draft:{...current.draft, checkedIds, skipped:false}}));
    setFormError(''); setNotice('');
  }

  async function saveRecord(skip = false) {
    const checkedIds = skip ? [] : editor.draft.checkedIds;
    await commit(current => saveExperienceRecord(current, editor.context.tripId, editor.context.itemId, checkedIds, editor.draft.note, skip), 'recordSaved');
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (discardPrompt) { setDiscardPrompt(false); pendingLeave.current = null; return true; }
      if (editor) { requestLeave(); return true; }
      if (unit) { setUnit(null); return true; }
      if (page === 'trips' && selectedTripId) { setSelectedTripId(null); return true; }
      if (page !== 'discover') { setPage('discover'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [discardPrompt, editor, editorDirty, unit, page, selectedTripId]);

  function renderDiscard() {
    return <View style={styles.card} accessibilityViewIsModal>
      <Text accessibilityRole="header" style={styles.title}>{n.discardTitle}</Text><Text>{n.discardBody}</Text>
      <Button title={n.keepEditing} onPress={() => {setDiscardPrompt(false); pendingLeave.current = null;}} />
      <Button title={n.discard} danger onPress={finishLeave} />
    </View>;
  }

  function renderEditor() {
    if (discardPrompt) return renderDiscard();
    if (!editor) return null;
    const errorText = formError ? (t[formError] ?? t.invalid) : '';
    if (editor.kind === 'trip') return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t.newTrip}</Text><Text>{n.createTripHelp}</Text>
      <Text style={styles.badge}>{n.privateOnly}</Text><Text>{t.korea} · {t.seoul} · {t.seongsu}</Text>
      <Field label={t.tripName} value={editor.draft.name} onChangeText={value => updateDraft('name', value)} maxLength={80} />
      <Field label={`${t.startDate} (YYYY-MM-DD)`} value={editor.draft.startDate} onChangeText={value => updateDraft('startDate', value)} maxLength={10} />
      <Field label={`${t.endDate} (YYYY-MM-DD)`} value={editor.draft.endDate} onChangeText={value => updateDraft('endDate', value)} maxLength={10} />
      {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
      <Button title={t.create} onPress={saveTrip} disabled={busy} /><Button title={t.cancel} onPress={() => requestLeave()} />
    </View>;
    if (editor.kind === 'add') return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t.add}</Text>
      <Text style={styles.subtitle}>{textFor(editor.context.unit.title, locale, editor.context.unit.sourceLocale)}</Text>
      <Text>{n.selectTripFirst}</Text>
      {state.trips.map(trip => <Button key={trip.id} title={`${trip.name} · ${trip.startDate}`} selected={editor.draft.tripId === trip.id} onPress={() => chooseAddTrip(trip.id)} />)}
      <Field label={`${t.day} (YYYY-MM-DD)`} value={editor.draft.date} onChangeText={value => updateDraft('date', value)} maxLength={10} />
      <Field label={`${t.start} (HH:mm)`} value={editor.draft.startTime} onChangeText={value => updateDraft('startTime', value)} maxLength={5} />
      <Text style={styles.muted}>{n.scheduleSource}: {editor.context.unit.versionId}</Text>
      {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
      <Button title={t.save} onPress={saveAddedUnit} disabled={busy} /><Button title={t.cancel} onPress={() => requestLeave()} />
    </View>;
    if (editor.kind === 'schedule') return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t.editSchedule}</Text>
      <Text>{textFor(editor.context.snapshot.title, locale, editor.context.snapshot.sourceLocale)}</Text>
      <Text style={styles.muted}>{n.scheduleSource}: {editor.context.snapshot.versionId}</Text>
      <Field label={`${t.day} (YYYY-MM-DD)`} value={editor.draft.date} onChangeText={value => updateDraft('date', value)} maxLength={10} />
      <Field label={`${t.start} (HH:mm)`} value={editor.draft.startTime} onChangeText={value => updateDraft('startTime', value)} maxLength={5} />
      <Field label={t.plannedDuration} value={editor.draft.durationMinutes} onChangeText={value => updateDraft('durationMinutes', value)} keyboardType="number-pad" maxLength={4} />
      <Field label={t.movementMinutes} value={editor.draft.movementMinutes} onChangeText={value => updateDraft('movementMinutes', value)} keyboardType="number-pad" maxLength={4} />
      <Field label={t.breakMinutes} value={editor.draft.breakMinutes} onChangeText={value => updateDraft('breakMinutes', value)} keyboardType="number-pad" maxLength={4} />
      <Text>{n.manualPlan}</Text>
      {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
      <Button title={t.save} onPress={saveSchedule} disabled={busy} /><Button title={t.cancel} onPress={() => requestLeave()} />
    </View>;
    const snapshot = editor.context.snapshot;
    return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t.todayExperience}</Text>
      <Text style={styles.subtitle}>{textFor(snapshot.title, locale, snapshot.sourceLocale)}</Text>
      <Text>{t.checklist}</Text>
      {snapshot.points.map(point => {
        const checked = editor.draft.checkedIds.includes(point.id);
        return <Button key={point.id} selected={checked}
          title={`${checked ? '✓' : '○'} ${textFor(point.text, locale, snapshot.sourceLocale)} · ${checked ? n.checkOn : n.checkOff}`}
          onPress={() => togglePoint(point.id)} />;
      })}
      <Field label={t.note} value={editor.draft.note} onChangeText={value => updateDraft('note', value)} multiline maxLength={2000} />
      <Text>{t.selfReported}</Text><Text style={styles.muted}>{n.scheduleSource}: {snapshot.versionId}</Text>
      {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
      <Button title={t.saveRecord} onPress={() => saveRecord(false)} disabled={busy} />
      <Button title={n.skipSave} onPress={() => saveRecord(true)} disabled={busy} />
      <Button title={t.cancel} onPress={() => requestLeave()} />
    </View>;
  }

  function renderUnit() {
    const localized = value => textFor(value, original ? unit.sourceLocale : locale, unit.sourceLocale);
    return <View style={styles.card}>
      <Button title={t.back} onPress={() => setUnit(null)} /><Text style={styles.badge}>{n.unverified}</Text>
      <Text accessibilityRole="header" style={styles.title}>{localized(unit.title)}</Text>
      <Text>{unit.sourceType === 'ai_draft' ? t.aiDraft : `${t.originalExperience} · ${t.local}`}</Text>
      <Text>{t.author}: {unit.author} · {t.version} {unit.version}</Text>
      <Text style={styles.muted}>{unit.id} / {unit.versionId}</Text><Text>{n.source}: {unit.sourceLocale}</Text>
      <Text>{original || locale === unit.sourceLocale ? t.original : t.translation}</Text>
      {locale !== unit.sourceLocale ? <Button title={original ? t.viewTranslated : t.viewOriginal} onPress={() => setOriginal(!original)} /> : null}
      <Text>{localized(unit.description)}</Text><Text>{localized(unit.place)}</Text>
      <Text>{unit.durationMinutes} {t.minutes} · {costLabel(unit.cost, locale)}</Text>
      <Text style={styles.subtitle}>{t.points}</Text>
      {unit.points.map((point, index) => <Text key={point.id}>{index + 1}. {localized(point.text)}</Text>)}
      <Text style={styles.subtitle}>{t.tip}</Text><Text>{localized(unit.tip)}</Text>
      <Button title={t.add} onPress={() => startAddToTrip(unit)} />
    </View>;
  }

  function renderDiscover() {
    return <>
      <Text accessibilityRole="header" style={styles.title}>{t.intro}</Text>
      <View style={styles.card}><Text style={styles.subtitle}>{n.chooseArea}</Text><Text>{n.oneArea}</Text>
        <Button title={region ? n.changeArea : n.selectArea} onPress={() => {setRegion(region ? null : demoRegion); setQuery('');}} />
        {region ? <Text>{t.korea} · {t.seoul} · {t.seongsu}</Text> : null}
      </View>
      {region ? <>
        <Field label={t.search} value={query} onChangeText={setQuery} />
        {filterUnits(catalog, {query, region}).map(item => <View key={item.versionId} style={styles.card}>
          <Text style={styles.badge}>{n.unverified}</Text><Text style={styles.subtitle}>{textFor(item.title, locale, item.sourceLocale)}</Text>
          <Text>{item.sourceType === 'ai_draft' ? t.aiDraft : `${t.originalExperience} · ${t.local}`}</Text>
          <Text>{item.durationMinutes} {t.minutes} · {costLabel(item.cost, locale)}</Text>
          <Button title={t.detail} onPress={() => {setOriginal(false); setUnit(item);}} />
        </View>)}
        {!filterUnits(catalog, {query, region}).length ? <Text>{t.empty}</Text> : null}
      </> : null}
    </>;
  }

  function renderTripSchedule(trip) {
    const items = sortedItems(trip.items);
    const conflicts = new Set(findConflicts(items).flat());
    return <>
      <Button title={n.backTrips} onPress={() => setSelectedTripId(null)} />
      <Text accessibilityRole="header" style={styles.title}>{trip.name}</Text>
      <Text style={styles.badge}>{n.privateOnly}</Text><Text>{n.tripDates}: {trip.startDate} – {trip.endDate}</Text>
      <Text>{t.korea} · {t.seoul} · {t.seongsu}</Text>
      {!items.length ? <View style={styles.card}><Text>{n.noNativeUnits}</Text><Button title={t.addMore} onPress={() => navigate('discover')} /></View> : null}
      {items.map(item => {
        const record = state.records[item.id];
        return <View key={item.id} style={styles.card}>
          {conflicts.has(item.id) ? <Text accessibilityRole="alert" style={styles.error}>{t.conflict}</Text> : null}
          <Text style={styles.subtitle}>{textFor(item.snapshot.title, locale, item.snapshot.sourceLocale)}</Text>
          <Text>{item.date} · {item.startTime}–{timeOf(scheduleEnd(item))}</Text>
          <Text>{t.plannedTime}: {item.durationMinutes} {t.minutes} · {t.movement}: {item.movementMinutes ?? 0} · {t.breakTime}: {item.breakMinutes ?? 0}</Text>
          <Text style={styles.muted}>{n.scheduleSource}: {item.unitVersionId}</Text>
          <Text>{n.currentStatus}: {t[record?.status ?? 'planned']}</Text>
          <Button title={t.editSchedule} onPress={() => startSchedule(trip, item)} />
          <Button title={t.experience} onPress={() => startRecord(trip, item)} />
        </View>;
      })}
      <Button title={t.addMore} onPress={() => navigate('discover')} />
    </>;
  }

  function renderTrips() {
    if (selectedTrip) return renderTripSchedule(selectedTrip);
    return <>
      <Text accessibilityRole="header" style={styles.title}>{t.titleTrips}</Text><Text>{t.myTripsIntro}</Text>
      <Button title={t.newTrip} onPress={startTrip} />
      {!state.trips.length ? <Text>{t.noTrips}</Text> : null}
      {state.trips.map(trip => <View key={trip.id} style={styles.card}>
        <Text style={styles.subtitle}>{trip.name}</Text><Text style={styles.badge}>{n.privateOnly}</Text>
        <Text>{trip.startDate} – {trip.endDate} · {trip.items.length} {t.units}</Text>
        <Button title={n.tripOpen} onPress={() => setSelectedTripId(trip.id)} />
      </View>)}
    </>;
  }

  function renderSettings() {
    return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t.language}</Text>
      {[['auto', t.automatic], ['ko', '한국어'], ['en', 'English']].map(([value, title]) =>
        <Button key={value} title={title} selected={state.preference === value} disabled={busy || !!error} onPress={() => setLanguage(value)} />)}
      <Text>{t.contentLanguage}</Text><Text style={styles.subtitle}>{t.storageTitle}</Text><Text>{n.nativeStorage}</Text>
      <Text style={styles.subtitle}>{t.privacyTitle}</Text><Text>{t.privacyBody}</Text>
      <Text style={styles.subtitle}>{t.serverTitle}</Text><Text>{t.serverBody}</Text>
    </View>;
  }

  const content = editor ? renderEditor() : unit ? renderUnit() : page === 'discover' ? renderDiscover() :
    page === 'trips' ? renderTrips() : page === 'settings' ? renderSettings() :
    <View style={styles.card}><Text accessibilityRole="header" style={styles.title}>{t.mine}</Text><Text>{t.writeLater}</Text></View>;

  return <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content" />
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><Text accessibilityRole="header" style={styles.brand}>{t.brand}</Text><Text style={styles.muted}>{n.phase}</Text></View>
      {busy && !state ? <View style={styles.card}><ActivityIndicator /><Text>{n.loading}</Text></View> : null}
      {error ? <View style={styles.card}><Text accessibilityRole="alert">{error === 'loadError' ? t.loadError : n.nativeSaveError}</Text><Button title={n.retry} onPress={load} disabled={busy} /></View> : null}
      {state ? <>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.notice}>{t.demo}</Text>
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{n[notice] ?? t.saved}</Text> : null}
          {content}
        </ScrollView>
        <View style={styles.navigation}>{['trips','discover','mine','settings'].map(tab =>
          <Button key={tab} title={t[tab]} selected={page === tab && !unit && !editor} onPress={() => navigate(tab)} />)}</View>
      </> : null}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: {flex:1, backgroundColor:'#f7f5ee'},
  header: {padding:16, gap:4}, brand: {fontSize:24, fontWeight:'700', color:'#164e43'},
  content: {padding:16, gap:16, paddingBottom:32}, card: {backgroundColor:'#fff', padding:16, borderRadius:16, gap:12},
  title: {fontSize:24, fontWeight:'700', color:'#164e43'}, subtitle: {fontSize:18, fontWeight:'600', color:'#164e43'},
  muted: {color:'#535b56'}, badge: {color:'#79521a', fontWeight:'600'}, notice: {color:'#535b56', lineHeight:21},
  field: {gap:6}, label: {fontWeight:'600'}, input: {borderWidth:1, borderColor:'#6e8076', borderRadius:10, padding:12, minHeight:48, backgroundColor:'#fff', color:'#182d25'},
  noteInput: {minHeight:112, textAlignVertical:'top'},
  button: {minHeight:48, justifyContent:'center', alignItems:'center', padding:12, borderWidth:1, borderColor:'#386657', borderRadius:10, flexShrink:1},
  buttonText: {color:'#164e43', fontSize:15, textAlign:'center'}, selected: {backgroundColor:'#164e43'}, selectedText: {color:'#fff'}, dim: {opacity:0.5},
  danger: {borderColor:'#9a332b'}, dangerText: {color:'#9a332b'}, error: {color:'#a12820', fontWeight:'600'}, success: {color:'#176249', fontWeight:'600'},
  navigation: {padding:12, flexDirection:'row', flexWrap:'wrap', justifyContent:'space-around', gap:8, borderTopWidth:1, borderTopColor:'#ced7cd'},
});
