<script>
	import {
		DataTable,
		Button,
		Link,
		Tabs,
		Tab,
		TextInput,
		DataTableSkeleton,
		TabsSkeleton,
		ButtonSkeleton,
		SkeletonText,
		LocalStorage,
		ProgressBar
	} from 'carbon-components-svelte';
	import { Play, Rocket, ArrowLeft, Music } from 'carbon-icons-svelte';
	/**
	 * @typedef {import("carbon-components-svelte/src/DataTable/DataTable.svelte").DataTableRow} DataTableRow
	 */
	import 'carbon-components-svelte/css/g100.css';

	/** @type {import('./$types').PageData} */
	export let data;

	/**
	 * @typedef SetData
	 * @property {SetItem[]} items
	 * @property {SetInfo} info
	 */

	/**
	 * @typedef SetInfo
	 * @property {string} name
	 */

	/**
	 * @typedef SetItem
	 * @property {number} id
	 * @property {string} word
	 * @property {string} kana
	 * @property {string} audio
	 * @property {string[]} examples
	 */
	let loaded_data = getData();

	/**
	 * @returns {Promise<SetData>}
	 */
	async function getData() {
		const got_data = await fetch(`/sets/${data.slug}.json`);
		return got_data
			.json()
			.then((d) => {
				return d;
			})
			.catch((e) => {
				alert(`Failed to load set data: ${e}`);
			});
	}

	const audioElement = new Audio();

	/**
	 * @param {string} audio
	 */
	const playAudio = async (audio) => {
		if (!audioElement.paused) {
			return;
		}
		audioElement.src = audio;
		audioElement.load();
		audioElement.play();
	};

	let selected_mode = 1;
	let selected_mode_name = 'Listening';
	$: {
		switch (selected_mode) {
			case 0:
				selected_mode_name = 'Listening';
				break;
			case 1:
				selected_mode_name = 'Reading';
				break;
			case 2:
				selected_mode_name = 'Writing';
				break;
		}
	}

	/**
	 * @enum {number}
	 */
	const MODE = {
		VIEWING: 0,
		PRACTICING: 1
	};

	/**
	 * @enum {number}
	 */
	const COUNT = {
		FIVE: 0,
		TEN: 1,
		TWENTY: 2,
		FIFTY: 3,
		UNLIMITED: 4
	};

	/**
	 * @type {{[key: number]: number?}}
	 */
	const count_num_mapping = {
		0: 5,
		1: 10,
		2: 20,
		3: 50,
		4: null
	};

	let current_mode = MODE.VIEWING;
	let current_count = COUNT.UNLIMITED;
	$: current_count_number = count_num_mapping[current_count];

	const finishPractice = () => {
		current_mode = MODE.VIEWING;
	};

	/**
	 * @typedef PracticeState
	 * @property {number} current_question
	 * @property {number?} max_questions
	 * @property {number} correct
	 * @property {number} incorrect
	 * @property {SetItem?} current_item
	 * @property {SetItem[]} data
	 */

	/**
	 * @type {?PracticeState}
	 */
	let current_practice_state = null;

	const practiceStateNext = () => {
		if (current_practice_state == null) return;
		const use_question = current_practice_state.current_question;
		const max_questions = current_practice_state.max_questions;
		current_practice_state.current_question++;
		if (max_questions && use_question >= max_questions) {
			finishPractice();
			return;
		}
		current_practice_state.current_item = current_practice_state.data[use_question];
		if (selected_mode_name == 'Listening') {
			playAudio(current_practice_state?.current_item?.audio || '');
		}
	};

	/**
	 * @param {SetItem[]} data
	 */
	const startPracticeState = (data) => {
		current_practice_state = {
			current_question: 0,
			max_questions: current_count_number,
			correct: 0,
			incorrect: 0,
			current_item: null,
			data: data
		};
		practiceStateNext();
		current_mode = MODE.PRACTICING;
	};
</script>

<LocalStorage key="count_chosen" bind:value={current_count} />
<LocalStorage key="mode_chosen" bind:value={selected_mode} />

{#await loaded_data}
	<div class="back-box">
		<ButtonSkeleton></ButtonSkeleton>
	</div>
	<div class="start-box">
		<div class="inner">
			<SkeletonText />
			<TabsSkeleton>
				<Tab label="Listening" />
				<Tab label="Reading" />
				<Tab label="Writing" />
			</TabsSkeleton>
			<p>Questions:</p>
			<TabsSkeleton>
				<Tab label="5" />
				<Tab label="10" />
				<Tab label="20" />
				<Tab label="50" />
				<Tab label="∞" />
			</TabsSkeleton>
			<div class="small-padding"></div>
			<ButtonSkeleton></ButtonSkeleton>
		</div>
	</div>

	<div class="word-list">
		<DataTableSkeleton
			headers={[
				{ key: 'word', value: 'Word' },
				{ key: 'kana', value: 'Kana' },
				{ key: 'audio', value: 'Audio' }
			]}
			rows={30}
		></DataTableSkeleton>
	</div>
{:then got_data}
	<div class="back-box">
		<Button
			iconDescription={current_mode == MODE.PRACTICING ? 'Back to list' : 'Back to sets'}
			icon={ArrowLeft}
			on:click={() => {
				if (current_mode == MODE.PRACTICING) {
					finishPractice();
				} else {
					window.location.href = '/';
				}
			}}
		></Button>
	</div>
	{#if current_mode == MODE.VIEWING}
		<div class="start-box">
			<div class="inner">
				<h2><b>{got_data.info.name}</b></h2>
				<Tabs bind:selected={selected_mode} autoWidth>
					<Tab label="Listening" />
					<Tab label="Reading" />
					<Tab label="Writing" />
				</Tabs>
				<p>Questions:</p>
				<Tabs bind:selected={current_count} autoWidth>
					<Tab label="5" />
					<Tab label="10" />
					<Tab label="20" />
					<Tab label="50" />
					<Tab label="∞" />
				</Tabs>
				<div class="small-padding"></div>
				<Button
					iconDescription={'start'}
					icon={Rocket}
					on:click={() => startPracticeState(got_data.items)}
				></Button>
			</div>
		</div>

		<div class="word-list">
			<DataTable
				headers={[
					{ key: 'word', value: 'Word' },
					{ key: 'kana', value: 'Kana' },
					{ key: 'audio', value: 'Audio' }
				]}
				rows={got_data.items}
			>
				<svelte:fragment slot="cell" let:row let:cell>
					{#if cell.key === 'kana'}
						<Link href="https://jisho.org/search/{cell.value}">{cell.value}</Link>
					{:else if cell.key === 'audio'}
						<Button
							on:click={() => playAudio(cell.value)}
							icon={Play}
							disabled={cell.value == ''}
							iconDescription="Play"
						/>
					{:else}
						{cell.value}
					{/if}
				</svelte:fragment>
			</DataTable>
		</div>
	{:else}
		<div class="top-bar">
			{#if current_practice_state?.max_questions}
				<ProgressBar
					hideLabel
					max={current_practice_state?.max_questions}
					value={current_practice_state?.current_question}
				/>
			{/if}
		</div>
		<div class="mid-content-frame">
			<div class="mid-content-frame-child">
				{#if selected_mode_name == 'Listening'}
					<Button
						icon={Music}
						iconDescription="Play sound"
						on:click={() => playAudio(current_practice_state?.current_item?.audio || '')}
					/>
				{:else}
					<p class="mid-content-text">
						{selected_mode_name == 'Writing'
							? current_practice_state?.current_item?.word || '?'
							: current_practice_state?.current_item?.kana || '?'}
					</p>
				{/if}
			</div>
		</div>
		<div class="bottom-bar">
			<div class="bottom-bar-text-area">
				<TextInput
					light
					placeholder="Enter answer"
					on:keydown={(event) => {
						if (event.code == 'Enter') {
							practiceStateNext();
						}
					}}
				/>
			</div>
		</div>
	{/if}
{:catch error}
	<p>error: {error.message}</p>
{/await}

<style>
	.top-bar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 50px;
		background: #262626;
		z-index: -1;
	}

	.mid-content-frame {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		display: flex;
		z-index: -10;
		justify-content: center;
	}

	.mid-content-frame-child {
		float: right;
		text-align: center;
		width: 100%;
		padding: 10px;
		margin-top: auto;
		margin-bottom: auto;
	}

	.mid-content-text {
		font-size: 50px;
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 80px;
		background: #262626;
		z-index: -1;
	}

	.bottom-bar-text-area {
		margin: auto;
		width: 50%;
		padding: 10px;
	}

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
		padding-top: 10px;
		background: #262626;
		width: 100%;
		height: 100%;
	}

	/* Split the screen in half */
	.word-list {
		right: 0;
		width: 500px;
		height: 90%;
		position: fixed;
		z-index: 1;
		top: 0;
		overflow-x: hidden;
	}

	.small-padding {
		padding-top: 10px;
	}

	@media only screen and (max-width: 800px) {
		.word-list {
			width: 100%;
			position: relative;
		}
	}
</style>
