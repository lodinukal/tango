<script>
	import { playAudio } from '$lib/set';
	import readXlsxFile from 'read-excel-file';

	import {
		Button,
		ComposedModal,
		DataTable,
		FileUploader,
		FileUploaderDropContainer,
		LocalStorage,
		ModalBody,
		ModalFooter,
		ModalHeader,
		StructuredListInput,
		NumberInput,
		TextInput,
		Checkbox,
		Search,
		Link,
		Theme
	} from 'carbon-components-svelte';
	/**
	 * @typedef {import("carbon-components-svelte/src/DataTable/DataTable.svelte").DataTableRow} DataTableRow
	 */
	import 'carbon-components-svelte/css/all.css';
	import {
		Add,
		ArrowLeft,
		Copy,
		Delete,
		DocumentDownload,
		Play,
		Restart,
		Save,
		SearchLocate,
		TrashCan
	} from 'carbon-icons-svelte';
	import { convert } from '$lib/jp-conversion';

	/**
	 * @typedef {import('$lib/set').SetData} SetData
	 * @typedef {import('$lib/set').SetItem} SetItem
	 *
	 */

	/**
	 * @type {?SetData}
	 */
	let save_data = null;

	/**
	 * @type {SetData}
	 */
	let edit_data = {
		info: {
			name: 'Untitled set'
		},
		items: []
	};
	$: {
		if (save_data != null) {
			edit_data = save_data;
		}
	}

	let id_max = 0;
	$: {
		id_max = edit_data.items?.length || 0;
	}
	const getId = () => {
		const check_data = edit_data.items || [];
		for (let i = 0; i < id_max; i++) {
			if (check_data[i] != undefined) {
				continue;
			}
			return i;
		}
		return id_max;
	};

	const save = () => {
		save_data = { ...edit_data };
	};

	let current_word_search = '';
	/**
	 * @typedef Result
	 * @prop {number} id
	 * @prop {string} word
	 * @prop {string} pathmp3
	 * @prop {string} pathogg
	 * @prop {number} hits
	 * @prop {string} username
	 */
	/**
	 * @type {Result[]}
	 */
	let found_word_results = [];
	let loading_results = false;
	const getWord = async () => {
		loading_results = true;
		found_word_results = (await (await fetch(`/api/word-get?word=${current_word_search}`)).json())
			.items;
		found_word_results.sort((a, b) => b.hits - a.hits);
		found_word_results = found_word_results.slice(0, 5);
		loading_results = false;
	};

	/**
	 * @param {string} kana
	 * @param {string} kanji
	 */
	const getJpPodLink = (kana, kanji) => {
		const url = new URL('http://assets.languagepod101.com/dictionary/japanese/audiomp3.php');
		let none = true;
		if (kana != '') {
			url.searchParams.append('kana', kana);
			none = false;
		}
		if (kanji != '') {
			url.searchParams.append('kanji', kanji);
			none = false;
		}
		if (none) {
			return '';
		}
		return url.href;
	};

	let current_jp_pod_kanji_search = '';
	let current_jp_pod_kana_search = '';
	let current_jp_pod_href = '';
	$: current_jp_pod_href = getJpPodLink(current_jp_pod_kana_search, current_jp_pod_kanji_search);

	let excel_import_modal_open = false;
	/**
	 * @type {?import('read-excel-file').Row[]}
	 */
	let excel_document = null;
	let excel_document_file_name = '';
	let skip_header = false;
	let excel_document_word_column = 1;
	let excel_document_kana_column = 2;
	let excel_document_audio_column = 0;
	/**
	 * @type {import('read-excel-file').Row}
	 */
	let excel_document_rows = [];
	$: {
		if (excel_document != null) {
			excel_document_rows = excel_document[skip_header ? 1 : 0];
		}
	}

	const forvo_enabled = localStorage.getItem('forvo_enabled') === 'true';
	/**
	 * @type {?number}
	 */
	let last_row_search = null;
</script>

<ComposedModal
	open={excel_import_modal_open}
	preventCloseOnClickOutside
	on:click:button--primary={() => {
		if (excel_document == null) {
			return;
		}
		edit_data = {
			info: {
				name: excel_document_file_name.split('.').slice(0, -1).join('.')
			},
			items: []
		};
		let id = 0;
		for (let i = skip_header ? 1 : 0; i < excel_document.length; i++) {
			const row = excel_document[i];
			edit_data.items.push({
				id: id++,
				word: excel_document_word_column == 0 ? '' : row[excel_document_word_column - 1].toString(),
				kana: excel_document_kana_column == 0 ? '' : row[excel_document_kana_column - 1].toString(),
				audio:
					excel_document_audio_column == 0 ? '' : row[excel_document_audio_column - 1].toString(),
				examples: []
			});
		}
		save();
		excel_import_modal_open = false;
	}}
>
	<ModalHeader title="Excel Import" />
	<ModalBody>
		<p>Leave columns at 0 to not include them</p>
		<p>First row looks like:</p>
		<p>{excel_document_rows.join(', ')}</p>
		<Checkbox bind:checked={skip_header} labelText={'Skip header'}></Checkbox>
		<NumberInput
			label={'Word column'}
			bind:value={excel_document_word_column}
			min={0}
			max={excel_document_rows.length}
		></NumberInput>
		<p>
			first word: {excel_document_word_column == 0
				? 'null'
				: excel_document_rows[excel_document_word_column - 1]}
		</p>
		<NumberInput
			label={'Kana column'}
			bind:value={excel_document_kana_column}
			min={0}
			max={excel_document_rows.length}
		></NumberInput>
		<p>
			first kana: {excel_document_kana_column == 0
				? 'null'
				: excel_document_rows[excel_document_kana_column - 1]}
		</p>
		<NumberInput
			label={'Audio column'}
			bind:value={excel_document_audio_column}
			min={0}
			max={excel_document_rows.length}
		></NumberInput>
		<p>
			first audio: {excel_document_audio_column == 0
				? 'null'
				: excel_document_rows[excel_document_audio_column - 1]}
		</p>
	</ModalBody>
	<ModalFooter primaryButtonText="Done" />
</ComposedModal>

<Theme persist persistKey="__theme" />

<div class="back-box">
	<Button
		iconDescription={'Back to list'}
		icon={ArrowLeft}
		on:click={() => {
			window.location.href = '/';
		}}
	/>
	<div class="start-box">
		<div class="inner">
			<TextInput
				value={edit_data.info.name}
				on:input={(e) => {
					if (edit_data == null) {
						edit_data = {
							info: {
								name: 'Untitled set'
							},
							items: []
						};
					}
					edit_data.info.name = e.detail?.toString() || '';
					save();
				}}
			/>
			<br />
			<Button
				iconDescription={'reset list'}
				icon={Restart}
				on:click={() => {
					if (confirm('Are you sure you want to reset the list?')) {
						edit_data = {
							info: {
								name: 'Untitled set'
							},
							items: []
						};
					}
				}}
			></Button>
			<div class="x-padding" />
			<Button
				icon={DocumentDownload}
				iconDescription={'save'}
				on:click={() => {
					// download the file
					const blob = new Blob([JSON.stringify(edit_data)], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = `${edit_data.info.name}.json`;
					a.click();
				}}
			/>
			<br />
			<br />
			<FileUploaderDropContainer
				labelText="Import list (excel or json) (will overwrite current list)"
				accept={['.json', '.xlsx']}
				on:change={async (e) => {
					// set edit data to the file
					const file = e.detail[0];
					switch (file.name.split('.').pop()) {
						case 'json':
							const json_parsed = JSON.parse(await file.text());
							edit_data = json_parsed;
							save();
							break;
						case 'xlsx':
							excel_document = await readXlsxFile(file);
							excel_import_modal_open = true;
							excel_document_file_name = file.name;
							break;
						default:
							alert('Invalid file type');
					}
				}}
			/>
		</div>
	</div>
	<div class="util-box">
		<div class="inner">
			<h4>Audio search (JapanesePod)</h4>
			<p>
				this will use JapanesePod's audio bank, enter some kanji and the corresponding kana, the
				link may not have any content so try it out in the entry fields first (make sure its kana
				first then kanji)
			</p>
			<TextInput inline labelText={'Kana'} bind:value={current_jp_pod_kana_search}></TextInput>
			<TextInput inline labelText={'Kanji'} bind:value={current_jp_pod_kanji_search}></TextInput>
			<br />
			<p>
				{#if current_jp_pod_href == ''}
					empty
				{:else}
					<Link href={current_jp_pod_href}>{current_jp_pod_href}</Link>
					<Button
						on:click={() => {
							navigator.clipboard.writeText(current_jp_pod_href);
							if (last_row_search) {
								edit_data.items[last_row_search].audio = current_jp_pod_href;
								save();
								last_row_search = null;
								playAudio(current_jp_pod_href, false);
							}
						}}
						icon={Copy}
					/>
				{/if}
			</p>
			<br />
		</div>
		<div class="inner">
			{#if forvo_enabled}
				<h4>Audio search (forvo)</h4>
				<TextInput inline labelText={'Search'} bind:value={current_word_search}></TextInput>
				<br />
				<Button icon={SearchLocate} on:click={getWord} iconDescription={'Search'}></Button>
				<div class="x-padding"></div>
				<Button
					icon={TrashCan}
					on:click={() => {
						found_word_results = [];
					}}
					disabled={loading_results}
					iconDescription={'Clear'}
				></Button>
				<br />
				{#if loading_results}
					<p>Loading...</p>
				{:else}
					{#each found_word_results as fwr}
						<div>
							<br />
							<p>{fwr.username}</p>
							<br />
							<Button
								icon={Play}
								on:click={() => playAudio(fwr.pathmp3, false)}
								disabled={fwr.pathmp3 == ''}
								tooltipPosition="left"
								iconDescription="Play"
							/>
							<div class="x-padding"></div>
							<Button
								on:click={() => {
									navigator.clipboard.writeText(fwr.pathmp3);
									if (last_row_search) {
										edit_data.items[last_row_search].audio = fwr.pathmp3;
										save();
										last_row_search = null;
										playAudio(fwr.pathmp3, false);
									}
								}}
								icon={Copy}
							/>
							<br />
						</div>
					{/each}
				{/if}
			{/if}
		</div>
	</div>
</div>

<div class="word-list">
	<DataTable
		headers={[
			{ key: 'word', value: 'Word', width: '50%px' },
			{ key: 'kana', value: 'Kana', width: '50%px' },
			{ key: 'audio', value: 'Audio' },
			{ key: 'search_forvo', value: 'Search' }
		]}
		rows={[
			...(edit_data.items || []),
			{
				id: -1
			}
		]}
		expandable
		nonExpandableRowIds={[-1]}
	>
		<svelte:fragment slot="cell" let:row let:cell>
			{#if row.id == -1}
				{#if cell.key === 'kana'}
					<Button
						iconDescription={'add word'}
						icon={Add}
						on:click={() => {
							edit_data = {
								info: edit_data.info || {
									name: 'Untitled set'
								},
								items: [
									...(edit_data.items || []),
									{
										id: getId(),
										word: 'word',
										kana: '言葉',
										audio:
											'https://d1vjc5dkcd3yh2.cloudfront.net/audio/b8b9e1a29679cebabb8175df6a9898cc.mp3',
										examples: []
									}
								]
							};
							save();
						}}
					/>
				{/if}
			{:else if cell.key === 'audio'}
				<Button
					on:click={() => playAudio(cell.value, false)}
					icon={Play}
					disabled={cell.value == ''}
					tooltipPosition="right"
					iconDescription="Play"
				/>
			{:else if cell.key === 'search_forvo'}
				<Button
					on:click={() => {
						current_word_search = row.kana;
						current_jp_pod_kana_search = convert(row.kana)?.hiragana || '';
						current_jp_pod_kanji_search = convert(row.kana)?.kanji || '';
						last_row_search = row.id;
					}}
					icon={SearchLocate}
					disabled={cell.value == ''}
					tooltipPosition="right"
					iconDescription="Search"
				/>
			{:else}
				{cell.value}
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="expanded-row" let:row>
			<div>
				<TextInput
					labelText="Word"
					value={edit_data.items[row.id].word}
					inline
					on:input={(e) => {
						if (edit_data == null) return;
						edit_data.items[row.id].word = e.detail?.toString() || '';
						edit_data = edit_data;
						save();
					}}
				/>
				<TextInput
					labelText="Kana"
					value={edit_data.items[row.id].kana}
					inline
					on:input={(e) => {
						if (edit_data == null) return;
						edit_data.items[row.id].kana = e.detail?.toString() || '';
						edit_data = edit_data;
						save();
					}}
				/>
				<TextInput
					labelText="Audio source"
					value={edit_data.items[row.id].audio}
					inline
					on:input={(e) => {
						if (edit_data == null) return;
						edit_data.items[row.id].audio = e.detail?.toString() || '';
						edit_data = edit_data;
						save();
					}}
				/>
				<Button
					icon={TrashCan}
					kind="danger"
					iconDescription={'delete'}
					on:click={() => {
						if (edit_data == null) return;
						edit_data.items.splice(row.id, 1);
						// go through the rows, update the ids
						for (let i = 0; i < edit_data.items.length; i++) {
							edit_data.items[i].id = i;
						}
						edit_data = edit_data;
						save();
					}}
				/>
			</div>
		</svelte:fragment>
	</DataTable>
</div>

<LocalStorage key="editing_data_rn" bind:value={save_data} />

<style>
	.back-box {
		left: 0;
		z-index: 2;
		padding-left: 20px;
		padding-top: 20px;
	}

	.start-box {
		left: 0;
		width: 300px;
		height: 265px;
		padding-left: 20px;
		padding-top: 20px;
		z-index: 3;
	}

	.start-box .inner {
		padding-left: 10px;
		padding-right: 10px;
		padding-top: 10px;
		width: 100%;
		height: 100%;
	}

	.start-box.inner:theme[g100] {
		background: #262626;
	}

	.start-box.inner:theme[white] {
		background: #f4f4f4;
	}

	.util-box {
		left: 0;
		width: 340px;
		padding-left: 20px;
		padding-top: 20px;
		padding-bottom: 20px;
		z-index: 3;
		display: inline-block;
		/* overflow:auto;  */
	}

	.util-box .inner {
		padding-left: 10px;
		padding-right: 10px;
		padding-top: 10px;
		width: 100%;
		height: 100%;
	}

	/* Dark mode */
	.util-box .inner:theme[g100] {
		background: #262626;
	}

	.util-box .inner:theme[white] {
		background: #f4f4f4;
	}

	/* Split the screen in half */
	.word-list {
		right: 0;
		width: 764px;
		height: 90%;
		position: fixed;
		z-index: 1;
		top: 0;
		overflow-x: hidden;
	}

	.x-padding {
		padding-left: 10px;
		display: inline;
	}

	@media only screen and (max-width: 1200px) {
		.word-list {
			width: 100%;
			position: relative;
		}
	}
</style>
