<script>
	import { playAudio } from '$lib/set';
	import {
		Button,
		DataTable,
		FileUploader,
		FileUploaderDropContainer,
		LocalStorage,
		TextInput
	} from 'carbon-components-svelte';
	/**
	 * @typedef {import("carbon-components-svelte/src/DataTable/DataTable.svelte").DataTableRow} DataTableRow
	 */
	import 'carbon-components-svelte/css/g100.css';
	import { Add, ArrowLeft, Delete, DocumentDownload, Play, Restart, Save, TrashCan } from 'carbon-icons-svelte';

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
</script>

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
					edit_data = { ...edit_data };
				}}
			/>
			<br />
			<Button
				iconDescription={'reset list'}
				icon={Restart}
				on:click={() => {
					edit_data = {
						info: {
							name: 'Untitled set'
						},
						items: []
					};
				}}
			></Button>
            <div class="x-padding" />
            <Button icon={DocumentDownload} iconDescription={'save'}
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
            <br>
            <br>
            <FileUploaderDropContainer
                labelText="Import list"
                accept={['.json']}
                on:change={async (e) => {
                    // set edit data to the file
                    const file = e.detail[0];
                    const json_parsed = JSON.parse(await file.text());
                    edit_data = json_parsed;
                    save();
                }}
            />
		</div>
	</div>
</div>

<div class="word-list">
	<DataTable
		headers={[
			{ key: 'word', value: 'Word', width: '50%px' },
			{ key: 'kana', value: 'Kana', width: '50%px' },
			{ key: 'audio', value: 'Audio' }
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
					iconDescription="Play"
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
                    }}
                />
                <Button icon={TrashCan} kind="danger" iconDescription={'delete'} on:click={
                    () => {
                        if (edit_data == null) return;
                        edit_data.items.splice(row.id, 1);
                        // go through the rows, update the ids
                        for (let i = 0; i < edit_data.items.length; i++) {
                            edit_data.items[i].id = i;
                        }
                        edit_data = edit_data;
                        save();
                    }
                }/>
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
		padding-bottom: 20px;
		z-index: 3;
	}

	.start-box .inner {
		padding-left: 10px;
		padding-right: 10px;
		padding-top: 10px;
		background: #262626;
		width: 100%;
		height: 100%;
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
