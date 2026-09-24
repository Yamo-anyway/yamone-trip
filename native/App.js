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
import { deleteUnitDraft, draftFromLatest, makeUnitDraft, publishUnitDraft, saveUnitDraft } from './authoring.js';
import { deleteImprovementProposal, makeImprovementProposal, saveImprovementProposal, sourceReference } from './lineage.js';
import { deleteTranslationVariant, makeTranslationVariant, saveTranslationVariant, translationDraft, translationFor } from './translations.js';
import { createBackup, parseBackup } from './backup.js';
import { exportBackupFile, isPickerCancellation, pickBackupFile } from './backup-files.js';
import { beginDraft, changeDraft, hasUnsavedChanges } from './drafts.js';
import { createIdGenerator } from './ids.js';
import { NativeRepository } from './storage.js';
import { nativeCopy } from './copy.js';

// No remote adapter, browser, map, upload or location module is imported here.
const repository = new NativeRepository(AsyncStorage);
const demoRegion = {country:'KR', city:'seoul', district:'seongsu'};
const appVersion = '0.8.0';

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
  const [backupCandidate, setBackupCandidate] = useState(null);
  const [backupError, setBackupError] = useState('');
  const locale = resolveLocale(state?.preference ?? 'auto', deviceLocale);
  const t = dictionaries[locale];
  const n = nativeCopy[locale];
  const selectedTrip = state?.trips.find(trip => trip.id === selectedTripId) ?? null;
  const editorDirty = hasUnsavedChanges(editor);

  function storedTranslation(target, targetLocale = locale) {
    return state ? translationFor(state,target,targetLocale) : null;
  }

  function displayedTitle(target, targetLocale = locale) {
    return storedTranslation(target,targetLocale)?.title ?? textFor(target.title,targetLocale,target.sourceLocale);
  }

  function displayedPoint(target, point, index, targetLocale = locale) {
    return storedTranslation(target,targetLocale)?.points[index]?.text ?? textFor(point.text,targetLocale,target.sourceLocale);
  }

  async function load() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const next = await repository.load();
      setState(next);
      setBackupCandidate(null); setBackupError('');
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
      if (tab !== 'settings') { setBackupCandidate(null); setBackupError(''); }
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

  function allPointIds(extra = []) {
    return [
      ...catalog.flatMap(item=>item.points.map(point=>point.id)),
      ...state.localUnits.flatMap(local=>local.versions.flatMap(version=>version.points.map(point=>point.id))),
      ...state.unitDrafts.flatMap(draft=>draft.points.map(point=>point.id)), ...extra,
    ];
  }

  function unitDraftForEditor(draft) {
    return {
      sourceLocale:draft.sourceLocale, title:draft.title, description:draft.description,
      place:draft.place, tip:draft.tip, category:draft.category,
      durationMinutes:String(draft.durationMinutes), costAmount:String(draft.cost.amount),
      currency:draft.cost.currency, points:draft.points.map(point=>({...point})),
    };
  }

  function startNewUnit() {
    const draftId=ids.next('draft',state.unitDrafts.map(draft=>draft.id));
    const pointId=ids.next('point',allPointIds());
    openEditor('unitDraft', {
      sourceLocale:locale, title:'', description:'', place:'', tip:'', category:'walk',
      durationMinutes:'30', costAmount:'0', currency:'KRW', points:[{id:pointId,text:''}],
    }, {draftId,unitId:null,baseVersionId:null,derivedFrom:null});
  }

  function resumeUnitDraft(draft) {
    openEditor('unitDraft',unitDraftForEditor(draft),{
      draftId:draft.id,unitId:draft.unitId,baseVersionId:draft.baseVersionId,derivedFrom:draft.derivedFrom,
    });
  }

  function startNextVersion(local) {
    try {
      const draftId=ids.next('draft',state.unitDrafts.map(draft=>draft.id));
      resumeUnitDraft(draftFromLatest(state,local.id,draftId));
    } catch { setNotice(''); setFormError('invalidUnitDraft'); }
  }

  function updateDraftPoint(pointId, text) {
    setEditor(current=>({...current,draft:{...current.draft,
      points:current.draft.points.map(point=>point.id===pointId?{...point,text}:point),
    }}));
    setFormError(''); setNotice('');
  }

  function addDraftPoint() {
    if (editor.draft.points.length>=5) return;
    const existing=allPointIds(editor.draft.points.map(point=>point.id));
    const id=ids.next('point',existing);
    setEditor(current=>({...current,draft:{...current.draft,points:[...current.draft.points,{id,text:''}]}}));
  }

  function removeDraftPoint(pointId) {
    if (editor.draft.points.length<=1) return;
    setEditor(current=>({...current,draft:{...current.draft,points:current.draft.points.filter(point=>point.id!==pointId)}}));
  }

  function currentUnitDraft() {
    return makeUnitDraft({...editor.draft,region:demoRegion},{
      draftId:editor.context.draftId, unitId:editor.context.unitId,
      baseVersionId:editor.context.baseVersionId, derivedFrom:editor.context.derivedFrom,
    });
  }

  async function saveLocalUnitDraft() {
    let draft;
    try { draft=currentUnitDraft(); } catch { setFormError('invalidUnitDraft'); return; }
    await commit(current=>saveUnitDraft(current,draft),'unitDraftSaved',()=>{setPage('mine');setUnit(null);});
  }

  async function saveLocalUnitVersion() {
    let draft;
    try { draft=currentUnitDraft(); } catch { setFormError('invalidUnitDraft'); return; }
    const versionIds=state.localUnits.flatMap(local=>local.versions.map(version=>version.versionId));
    const versionId=ids.next('version',versionIds);
    const unitIds=state.localUnits.map(local=>local.id);
    const newUnitId=draft.unitId===null?ids.next('unit',unitIds):null;
    await commit(current=>publishUnitDraft(current,draft,{newUnitId,versionId}),'unitVersionSaved',()=>{setPage('mine');setUnit(null);});
  }

  function confirmDeleteDraft(draft) {
    openEditor('deleteUnitDraft',{}, {draftId:draft.id,title:draft.title});
  }

  async function removeSavedDraft() {
    await commit(current=>deleteUnitDraft(current,editor.context.draftId),'unitDraftDeleted',()=>{setPage('mine');});
  }

  function startImprovement(target) {
    try { openEditor('improvement',{suggestion:''},{source:sourceReference(target),unit:target}); }
    catch { setFormError('invalidLineage'); }
  }

  async function saveImprovement() {
    let proposal;
    try {
      const existing=state.improvementProposals.map(item=>item.id);
      proposal=makeImprovementProposal(editor.context.unit,editor.draft.suggestion,ids.next('improvement',existing));
    } catch { setFormError('invalidImprovement'); return; }
    await commit(current=>saveImprovementProposal(current,proposal),'improvementSaved',()=>{setPage('mine');setUnit(null);});
  }

  function confirmDeleteImprovement(proposal) {
    openEditor('deleteImprovement',{}, {proposalId:proposal.id,source:proposal.source});
  }

  async function removeImprovement() {
    await commit(current=>deleteImprovementProposal(current,editor.context.proposalId),'improvementDeleted',()=>{setPage('mine');});
  }

  function startDerivative(target) {
    try {
      const reference=sourceReference(target);
      const draftId=ids.next('draft',state.unitDrafts.map(draft=>draft.id));
      const used=allPointIds();
      const pointIds=target.points.map(()=>{
        const next=ids.next('point',used); used.push(next); return next;
      });
      const sourceText=value=>value[target.sourceLocale] ?? Object.values(value)[0] ?? '';
      openEditor('unitDraft',{
        sourceLocale:target.sourceLocale,title:sourceText(target.title),description:sourceText(target.description),
        place:sourceText(target.place),tip:sourceText(target.tip),category:target.category,
        durationMinutes:String(target.durationMinutes),costAmount:String(target.cost.amount),currency:target.cost.currency,
        points:target.points.map((point,index)=>({id:pointIds[index],text:sourceText(point.text)})),
      },{draftId,unitId:null,baseVersionId:null,derivedFrom:reference});
    } catch { setFormError('invalidLineage'); }
  }

  function startTranslation(target, targetLocale) {
    try {
      const existing=storedTranslation(target,targetLocale);
      openEditor('translation',translationDraft(target,targetLocale,existing),{unit:target,targetLocale,existing:!!existing});
    } catch { setFormError('invalidTranslation'); }
  }

  function updateTranslationPoint(pointId, text) {
    setEditor(current=>({...current,draft:{...current.draft,
      points:current.draft.points.map(point=>point.id===pointId?{...point,text}:point),
    }}));
    setFormError(''); setNotice('');
  }

  async function saveTranslation(reviewStatus) {
    let variant;
    try {
      variant=makeTranslationVariant(editor.context.unit,editor.draft,{locale:editor.context.targetLocale,reviewStatus,method:'manual'});
    } catch { setFormError('invalidTranslation'); return; }
    await commit(current=>saveTranslationVariant(current,editor.context.unit,variant),reviewStatus==='user_reviewed'?'translationReviewed':'translationDraftSaved',()=>{setOriginal(false);});
  }

  function confirmDeleteTranslation() {
    openEditor('deleteTranslation',{}, {
      unitId:editor.context.unit.id,versionId:editor.context.unit.versionId,locale:editor.context.targetLocale,
      title:editor.draft.title,unit:editor.context.unit,
    });
  }

  async function removeTranslation() {
    await commit(current=>deleteTranslationVariant(current,editor.context.unitId,editor.context.versionId,editor.context.locale),'translationDeleted',()=>{setOriginal(true);});
  }

  async function exportLocalBackup() {
    if (lock.current || error) return;
    lock.current = true; setBusy(true); setBackupError(''); setNotice('');
    const createdAt = new Date().toISOString();
    try {
      const contents = createBackup(state, {createdAt, appVersion});
      await exportBackupFile(contents, createdAt);
      setNotice('backupExported');
    } catch (caught) {
      if (!isPickerCancellation(caught)) {
        const code = caught instanceof Error ? caught.message : 'backupError';
        setBackupError(code in n ? code : 'backupError');
      }
    } finally { lock.current = false; setBusy(false); }
  }

  async function chooseBackup() {
    if (lock.current || error) return;
    lock.current = true; setBusy(true); setBackupError(''); setNotice(''); setBackupCandidate(null);
    try {
      const file = await pickBackupFile();
      const candidate = parseBackup(file.text);
      setBackupCandidate({...candidate, fileName:file.name});
    } catch (caught) {
      if (!isPickerCancellation(caught)) {
        const code = caught instanceof Error ? caught.message : 'backupError';
        setBackupError(code in n ? code : 'backupError');
      }
    } finally { lock.current = false; setBusy(false); }
  }

  async function confirmBackupImport() {
    if (!backupCandidate) return;
    await commit(() => backupCandidate.state, 'backupImported', () => {
      setBackupCandidate(null); setBackupError(''); setRegion(null); setUnit(null);
      setSelectedTripId(null); setEditor(null); setPage('settings');
    });
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
    if (editor.kind === 'unitDraft') return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{editor.context.unitId?n.editLocalUnit:n.newLocalUnit}</Text>
      <Text style={styles.badge}>{n.localPrivateUnverified}</Text><Text>{n.localUnitHelp}</Text>
      {editor.context.derivedFrom ? <View style={styles.preview}>
        <Text style={styles.badge}>{n.derivativeDraft}</Text>
        <Text>{n.derivedFrom}: {editor.context.derivedFrom.title}</Text>
        <Text style={styles.muted}>{editor.context.derivedFrom.unitId} / {editor.context.derivedFrom.versionId}</Text>
        <Text>{n.derivativeAttributionHelp}</Text>
      </View> : null}
      {editor.context.unitId ? <Text>{n.source}: {editor.draft.sourceLocale} · {n.basedOnVersion}: {editor.context.baseVersionId}</Text> : <>
        <Text style={styles.label}>{n.originalLocale}</Text>
        <View style={styles.row}><Button title="한국어 (ko)" selected={editor.draft.sourceLocale==='ko'} onPress={()=>updateDraft('sourceLocale','ko')} /><Button title="English (en)" selected={editor.draft.sourceLocale==='en'} onPress={()=>updateDraft('sourceLocale','en')} /></View>
        <Field label={n.localeCode} value={editor.draft.sourceLocale} onChangeText={value=>updateDraft('sourceLocale',value)} maxLength={15} />
      </>}
      <Text>{t.korea} · {t.seoul} · {t.seongsu} · {n.manualRegion}</Text>
      <Field label={n.unitTitle} value={editor.draft.title} onChangeText={value=>updateDraft('title',value)} maxLength={120} />
      <Field label={n.unitDescription} value={editor.draft.description} onChangeText={value=>updateDraft('description',value)} multiline maxLength={1000} />
      <Field label={n.unitPlace} value={editor.draft.place} onChangeText={value=>updateDraft('place',value)} maxLength={300} />
      <Field label={t.tip} value={editor.draft.tip} onChangeText={value=>updateDraft('tip',value)} multiline maxLength={500} />
      <Text style={styles.label}>{t.category}</Text><View style={styles.row}>{['walk','cafe','sightseeing'].map(category=><Button key={category} title={t[category]} selected={editor.draft.category===category} onPress={()=>updateDraft('category',category)} />)}</View>
      <Field label={t.plannedDuration} value={editor.draft.durationMinutes} onChangeText={value=>updateDraft('durationMinutes',value)} keyboardType="number-pad" maxLength={4} />
      <Field label={n.costAmount} value={editor.draft.costAmount} onChangeText={value=>updateDraft('costAmount',value)} keyboardType="decimal-pad" maxLength={12} />
      <Field label={n.currencyCode} value={editor.draft.currency} onChangeText={value=>updateDraft('currency',value)} maxLength={3} />
      <Text style={styles.subtitle}>{n.authorPoints}</Text><Text>{n.pointHelp}</Text>
      {editor.draft.points.map((point,index)=><View key={point.id} style={styles.pointEditor}>
        <Field label={`${n.point} ${index+1}`} value={point.text} onChangeText={value=>updateDraftPoint(point.id,value)} maxLength={300} />
        <Text style={styles.muted}>{n.stablePointId}: {point.id}</Text>
        <Button title={n.removePoint} danger disabled={editor.draft.points.length<=1} onPress={()=>removeDraftPoint(point.id)} />
      </View>)}
      <Button title={n.addPoint} disabled={editor.draft.points.length>=5} onPress={addDraftPoint} />
      <Text>{n.immutableVersionHelp}</Text>
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{t[formError]??t.invalid}</Text> : null}
      <Button title={n.savePrivateDraft} onPress={saveLocalUnitDraft} disabled={busy} />
      <Button title={n.saveImmutableVersion} onPress={saveLocalUnitVersion} disabled={busy} />
      <Button title={t.cancel} onPress={()=>requestLeave()} />
    </View>;
    if (editor.kind === 'deleteUnitDraft') return <View style={styles.card} accessibilityViewIsModal>
      <Text accessibilityRole="header" style={styles.title}>{n.deleteDraftTitle}</Text>
      <Text>{editor.context.title}</Text><Text>{n.deleteDraftBody}</Text>
      <Button title={n.deleteDraft} danger onPress={removeSavedDraft} disabled={busy} />
      <Button title={t.cancel} onPress={()=>requestLeave()} />
    </View>;
    if (editor.kind === 'improvement') return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{n.proposeImprovement}</Text>
      <Text style={styles.badge}>{n.localProposal}</Text>
      <Text>{n.proposalSource}: {editor.context.source.title}</Text>
      <Text style={styles.muted}>{editor.context.source.unitId} / {editor.context.source.versionId}</Text>
      <Text>{n.improvementHelp}</Text>
      <Field label={n.improvementText} value={editor.draft.suggestion} onChangeText={value=>updateDraft('suggestion',value)} multiline maxLength={1000} />
      {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
      <Button title={n.saveImprovement} onPress={saveImprovement} disabled={busy} />
      <Button title={t.cancel} onPress={()=>requestLeave()} />
    </View>;
    if (editor.kind === 'deleteImprovement') return <View style={styles.card} accessibilityViewIsModal>
      <Text accessibilityRole="header" style={styles.title}>{n.deleteImprovementTitle}</Text>
      <Text>{editor.context.source.title}</Text><Text>{n.deleteImprovementBody}</Text>
      <Button title={n.deleteImprovement} danger onPress={removeImprovement} disabled={busy} />
      <Button title={t.cancel} onPress={()=>requestLeave()} />
    </View>;
    if (editor.kind === 'translation') {
      const source=editor.context.unit;
      const originalText=value=>value[source.sourceLocale] ?? Object.values(value)[0] ?? '';
      const existing=storedTranslation(source,editor.context.targetLocale);
      return <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{n.translationEditor}</Text>
        <Text style={styles.badge}>{n.localTranslation}</Text>
        <Text>{n.translationIdentity}: {source.id} / {source.versionId}</Text>
        <Text>{n.originalLocale}: {source.sourceLocale} → {editor.context.targetLocale}</Text>
        <Text>{n.translationHelp}</Text>
        {existing ? <Text>{n.translationStatus}: {n[existing.reviewStatus]}</Text> : null}
        <View style={styles.preview}><Text style={styles.label}>{t.original}</Text><Text>{originalText(source.title)}</Text><Text>{originalText(source.description)}</Text></View>
        <Field label={n.translatedTitle} value={editor.draft.title} onChangeText={value=>updateDraft('title',value)} maxLength={120} />
        <Field label={n.translatedDescription} value={editor.draft.description} onChangeText={value=>updateDraft('description',value)} multiline maxLength={1000} />
        <Field label={n.translatedPlace} value={editor.draft.place} onChangeText={value=>updateDraft('place',value)} maxLength={300} />
        <Field label={n.translatedTip} value={editor.draft.tip} onChangeText={value=>updateDraft('tip',value)} multiline maxLength={500} />
        <Text style={styles.subtitle}>{n.translatedPoints}</Text>
        {source.points.map((point,index)=><View key={point.id} style={styles.pointEditor}>
          <Text>{t.original}: {originalText(point.text)}</Text>
          <Field label={`${n.point} ${index+1}`} value={editor.draft.points[index].text} onChangeText={value=>updateTranslationPoint(point.id,value)} maxLength={300} />
          <Text style={styles.muted}>{n.samePointId}: {point.id}</Text>
        </View>)}
        {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
        <Button title={n.saveTranslationDraft} onPress={()=>saveTranslation('draft')} disabled={busy} />
        <Button title={n.markTranslationReviewed} onPress={()=>saveTranslation('user_reviewed')} disabled={busy} />
        {existing ? <Button title={n.deleteTranslation} danger onPress={confirmDeleteTranslation} /> : null}
        <Button title={t.cancel} onPress={()=>requestLeave()} />
      </View>;
    }
    if (editor.kind === 'deleteTranslation') return <View style={styles.card} accessibilityViewIsModal>
      <Text accessibilityRole="header" style={styles.title}>{n.deleteTranslationTitle}</Text>
      <Text>{editor.context.title}</Text><Text>{n.deleteTranslationBody}</Text>
      <Button title={n.deleteTranslation} danger onPress={removeTranslation} disabled={busy} />
      <Button title={t.cancel} onPress={()=>requestLeave()} />
    </View>;
    if (editor.kind === 'add') return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t.add}</Text>
      <Text style={styles.subtitle}>{displayedTitle(editor.context.unit)}</Text>
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
      <Text>{displayedTitle(editor.context.snapshot)}</Text>
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
      <Text style={styles.subtitle}>{displayedTitle(snapshot)}</Text>
      <Text>{t.checklist}</Text>
      {snapshot.points.map((point,index) => {
        const checked = editor.draft.checkedIds.includes(point.id);
        return <Button key={point.id} selected={checked}
          title={`${checked ? '✓' : '○'} ${displayedPoint(snapshot,point,index)} · ${checked ? n.checkOn : n.checkOff}`}
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
    const savedTranslation=storedTranslation(unit,locale);
    const embeddedTranslation=Object.prototype.hasOwnProperty.call(unit.title,locale) && locale!==unit.sourceLocale;
    const translated=Boolean(savedTranslation || embeddedTranslation);
    const originalView=original || !translated;
    const localized = (key,value) => originalView
      ? textFor(value,unit.sourceLocale,unit.sourceLocale)
      : savedTranslation?.[key] ?? textFor(value,locale,unit.sourceLocale);
    const sourceLabel=unit.sourceType==='ai_draft'?t.aiDraft:unit.sourceType==='user_authored'?n.localAuthored:`${t.originalExperience} · ${t.local}`;
    return <View style={styles.card}>
      <Button title={t.back} onPress={() => setUnit(null)} /><Text style={styles.badge}>{unit.sourceType==='user_authored'?n.localPrivateUnverified:n.unverified}</Text>
      <Text accessibilityRole="header" style={styles.title}>{localized('title',unit.title)}</Text>
      <Text>{sourceLabel}</Text>
      <Text>{t.author}: {unit.sourceType==='user_authored'?n.localDevice:unit.author} · {t.version} {unit.version}</Text>
      <Text style={styles.muted}>{unit.id} / {unit.versionId}</Text><Text>{n.source}: {unit.sourceLocale}</Text>
      {unit.derivedFrom ? <View style={styles.preview}>
        <Text style={styles.badge}>{n.attributedDerivative}</Text>
        <Text>{n.derivedFrom}: {unit.derivedFrom.title} · {t.version} {unit.derivedFrom.version}</Text>
        <Text style={styles.muted}>{unit.derivedFrom.unitId} / {unit.derivedFrom.versionId}</Text>
      </View> : null}
      <Text>{originalView ? t.original : t.translation}</Text>
      {!originalView && savedTranslation ? <Text style={styles.badge}>{savedTranslation.method==='machine'?n.machineTranslation:n.manualTranslation} · {n[savedTranslation.reviewStatus]}</Text> : null}
      {!originalView && !savedTranslation && embeddedTranslation ? <Text style={styles.badge}>{n.demoTranslation}</Text> : null}
      {translated ? <Button title={original ? t.viewTranslated : t.viewOriginal} onPress={() => setOriginal(!original)} /> : null}
      <Text>{localized('description',unit.description)}</Text><Text>{localized('place',unit.place)}</Text>
      <Text>{unit.durationMinutes} {t.minutes} · {costLabel(unit.cost, locale)}</Text>
      <Text style={styles.subtitle}>{t.points}</Text>
      {unit.points.map((point, index) => <Text key={point.id}>{index + 1}. {originalView ? textFor(point.text,unit.sourceLocale,unit.sourceLocale) : savedTranslation?.points[index]?.text ?? textFor(point.text,locale,unit.sourceLocale)}</Text>)}
      <Text style={styles.subtitle}>{t.tip}</Text><Text>{localized('tip',unit.tip)}</Text>
      {['ko','en'].filter(targetLocale=>targetLocale!==unit.sourceLocale).map(targetLocale=>{
        const existing=storedTranslation(unit,targetLocale);
        return <Button key={targetLocale} title={`${existing?n.editTranslation:n.createTranslation} · ${targetLocale==='ko'?'한국어':'English'}`} onPress={()=>startTranslation(unit,targetLocale)} />;
      })}
      <Button title={t.add} onPress={() => startAddToTrip(unit)} />
      <Button title={n.proposeImprovement} onPress={()=>startImprovement(unit)} />
      <Button title={n.createDerivative} onPress={()=>startDerivative(unit)} />
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
          <Text style={styles.badge}>{n.unverified}</Text><Text style={styles.subtitle}>{displayedTitle(item)}</Text>
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
          <Text style={styles.subtitle}>{displayedTitle(item.snapshot)}</Text>
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

  function renderMine() {
    return <>
      <Text accessibilityRole="header" style={styles.title}>{t.mine}</Text><Text>{n.myUnitsHelp}</Text>
      <Button title={n.newLocalUnit} onPress={startNewUnit} />
      {state.improvementProposals.length ? <Text style={styles.subtitle}>{n.savedImprovements}</Text> : null}
      {state.improvementProposals.map(proposal=><View key={proposal.id} style={styles.card}>
        <Text style={styles.badge}>{n.localProposal}</Text>
        <Text style={styles.subtitle}>{proposal.source.title}</Text>
        <Text>{n.proposalSource}: {proposal.source.unitId} / {proposal.source.versionId}</Text>
        <Text>{proposal.suggestion}</Text>
        <Button title={n.deleteImprovement} danger onPress={()=>confirmDeleteImprovement(proposal)} />
      </View>)}
      {state.unitDrafts.length ? <Text style={styles.subtitle}>{n.savedDrafts}</Text> : null}
      {state.unitDrafts.map(draft=><View key={draft.id} style={styles.card}>
        <Text style={styles.badge}>{n.localPrivateDraft}</Text><Text style={styles.subtitle}>{draft.title}</Text>
        <Text>{n.source}: {draft.sourceLocale} · {draft.points.length} {t.points}</Text>
        <Button title={n.resumeDraft} onPress={()=>resumeUnitDraft(draft)} />
        <Button title={n.deleteDraft} danger onPress={()=>confirmDeleteDraft(draft)} />
      </View>)}
      {state.localUnits.length ? <Text style={styles.subtitle}>{n.savedLocalUnits}</Text> : <Text>{n.noLocalUnits}</Text>}
      {state.localUnits.map(local=>{
        const latest=local.versions[local.versions.length-1];
        const hasDraft=state.unitDrafts.some(draft=>draft.unitId===local.id);
        const translations=state.translationVariants.filter(variant=>variant.unitId===latest.id && variant.versionId===latest.versionId);
        return <View key={local.id} style={styles.card}>
          <Text style={styles.badge}>{latest.derivedFrom?n.attributedDerivative:n.localPrivateUnverified}</Text>
          <Text style={styles.subtitle}>{displayedTitle(latest)}</Text>
          <Text>{n.versionCount}: {local.versions.length} · {n.source}: {latest.sourceLocale}</Text>
          {translations.length ? <Text>{n.savedTranslations}: {translations.map(variant=>`${variant.locale} · ${n[variant.reviewStatus]}`).join(' / ')}</Text> : null}
          {latest.derivedFrom ? <Text>{n.derivedFrom}: {latest.derivedFrom.title} · {latest.derivedFrom.versionId}</Text> : null}
          {local.versions.map(version=><Button key={version.versionId} title={`${t.version} ${version.version} · ${displayedTitle(version)}`} onPress={()=>{setOriginal(false);setUnit(version);}} />)}
          {hasDraft ? <Text>{n.nextVersionDraftExists}</Text> : <Button title={n.createNextVersion} onPress={()=>startNextVersion(local)} />}
        </View>;
      })}
    </>;
  }

  function renderSettings() {
    const preview = backupCandidate?.preview;
    return <>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{t.language}</Text>
        {[['auto', t.automatic], ['ko', '한국어'], ['en', 'English']].map(([value, title]) =>
          <Button key={value} title={title} selected={state.preference === value} disabled={busy || !!error} onPress={() => setLanguage(value)} />)}
        <Text>{t.contentLanguage}</Text><Text style={styles.subtitle}>{t.storageTitle}</Text><Text>{n.nativeStorage}</Text>
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{n.backupTitle}</Text>
        <Text>{n.backupPrivacy}</Text><Text style={styles.badge}>{n.backupNoUpload}</Text>
        <Button title={n.exportBackup} onPress={exportLocalBackup} disabled={busy || !!error} />
        <Button title={n.importBackup} onPress={chooseBackup} disabled={busy || !!error} />
        {backupError ? <Text accessibilityRole="alert" style={styles.error}>{n[backupError] ?? n.backupError}</Text> : null}
        {preview ? <View style={styles.preview} accessibilityLiveRegion="polite">
          <Text style={styles.subtitle}>{n.backupPreview}</Text>
          <Text>{n.backupFile}: {backupCandidate.fileName}</Text>
          <Text>{n.backupSource}: {preview.source === 'legacy_raw_v1' ? n.backupLegacy : preview.source.startsWith('raw_state_v') ? n.backupRaw : n.backupCurrent}</Text>
          <Text>{n.backupCreated}: {preview.createdAt ?? n.backupUnknownDate}</Text>
          <Text>{n.backupCounts}: {preview.tripCount} / {preview.itemCount} / {preview.recordCount}</Text>
          <Text>{n.backupAuthorCounts}: {preview.localUnitCount} / {preview.draftCount} / {preview.improvementCount} / {preview.translationCount}</Text>
          <Text style={styles.error}>{n.backupReplaceWarning}</Text>
          <Button title={n.confirmImport} danger onPress={confirmBackupImport} disabled={busy || !!error} />
          <Button title={t.cancel} onPress={() => {setBackupCandidate(null); setBackupError('');}} disabled={busy} />
        </View> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.subtitle}>{t.privacyTitle}</Text><Text>{t.privacyBody}</Text>
        <Text style={styles.subtitle}>{t.serverTitle}</Text><Text>{t.serverBody}</Text>
      </View>
    </>;
  }

  const content = editor ? renderEditor() : unit ? renderUnit() : page === 'discover' ? renderDiscover() :
    page === 'trips' ? renderTrips() : page === 'settings' ? renderSettings() : renderMine();

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
  preview: {gap:10, padding:12, borderWidth:1, borderColor:'#ced7cd', borderRadius:10},
  row: {flexDirection:'row',flexWrap:'wrap',gap:8}, pointEditor: {gap:8,padding:10,borderWidth:1,borderColor:'#e0e5df',borderRadius:10},
  button: {minHeight:48, justifyContent:'center', alignItems:'center', padding:12, borderWidth:1, borderColor:'#386657', borderRadius:10, flexShrink:1},
  buttonText: {color:'#164e43', fontSize:15, textAlign:'center'}, selected: {backgroundColor:'#164e43'}, selectedText: {color:'#fff'}, dim: {opacity:0.5},
  danger: {borderColor:'#9a332b'}, dangerText: {color:'#9a332b'}, error: {color:'#a12820', fontWeight:'600'}, success: {color:'#176249', fontWeight:'600'},
  navigation: {padding:12, flexDirection:'row', flexWrap:'wrap', justifyContent:'space-around', gap:8, borderTopWidth:1, borderTopColor:'#ced7cd'},
});
