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
		ProgressBar,
		Checkbox,
		ComposedModal,
		ModalBody,
		ModalFooter,
		ModalHeader,
		ToastNotification
	} from 'carbon-components-svelte';
	import { fuzzy, search } from 'fast-fuzzy';
	import { Play, Rocket, ArrowLeft, Music, Star, StarFilled, Restart } from 'carbon-icons-svelte';
	/**
	 * @typedef {import("carbon-components-svelte/src/DataTable/DataTable.svelte").DataTableRow} DataTableRow
	 */
	import 'carbon-components-svelte/css/g100.css';
	import { playAudio } from '$lib/set';
	import { createAnimationTriggerAction } from 'svelte-trigger-action';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';

	import { PUBLIC_ROOT } from '$env/static/public';

	console.log(PUBLIC_ROOT);

	/** @type {import('./$types').PageData} */
	export let data;

	let loaded_data = getData();

	/**
	 * @typedef {import('$lib/set').SetData} SetData
	 * @typedef {import('$lib/set').SetItem} SetItem
	 *
	 */

	/**
	 * @returns {Promise<SetData>}
	 */
	async function getData() {
		const scope = data.scope;
		const url_params = new URLSearchParams(window.location.search);
		if (scope == 'local') {
			/**
			 * @type {import('$lib/set').LocalList[]}
			 */
			let local_lists = JSON.parse(localStorage.getItem('local_lists') || '');
			const found = local_lists.find((i) => i.id == data.file);
			if (found != undefined) {
				return JSON.parse(found.json);
			}
		} else if (scope == 'preset') {
			// const got_data = await fetch(`/sets/${data.file}.json`);
			const got_data = await fetch(`/api/get-src?resource=${data.file}`);
			return got_data
				.json()
				.then((d) => {
					return d;
				})
				.catch((e) => {
					alert(`Failed to load set data: ${e}`);
				});
		} else if (scope == 'link') {
			const link = url_params.get('to') || '';
			const got_data = await fetch(link);
			return got_data
				.json()
				.then((d) => {
					return d;
				})
				.catch((e) => {
					alert(`Failed to load set data: ${e}`);
				});
		}
		return {
			info: {
				name: 'Untitled set'
			},
			items: []
		};
	}

	let selected_mode = 1;
	/**
	 * @type {"listening"|"reading"|"writing"}
	 */
	let selected_mode_name = 'listening';
	$: {
		switch (selected_mode) {
			case 0:
				selected_mode_name = 'listening';
				break;
			case 1:
				selected_mode_name = 'reading';
				break;
			case 2:
				selected_mode_name = 'writing';
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
	 * @property {number} done_questions
	 * @property {number?} max_questions
	 * @property {number} correct
	 * @property {number} incorrect
	 * @property {SetItem?} current_item
	 * @property {SetItem[]} data
	 * @property {number} tries_left
	 * @property {string[]} valid_answers
	 */

	/**
	 * @type {?PracticeState}
	 */
	let current_practice_state = null;

	/**
	 * @returns {?number}
	 */
	const lookForNextQuestion = () => {
		if (current_practice_state == null) return null;
		const current_set_progress = getLearnProgressSet(selected_mode_name);
		const current_set = current_practice_state.data;
		const current_set_ids = current_set.map((i) => i.id);
		current_set_ids.sort((a, b) => {
			const a_last = current_set_progress[a]?.last_practiced || '1970-01-01T00:00:00.000Z';
			const b_last = current_set_progress[b]?.last_practiced || '1970-01-01T00:00:00.000Z';
			const a_prog = current_set_progress[a]?.learn_stars || 0;
			const b_prog = current_set_progress[b]?.learn_stars || 0;
			const a_date = new Date(a_last);
			const b_date = new Date(b_last);
			if (a_prog != b_prog) {
				return a_prog - b_prog;
			}
			return a_date.getSeconds() - b_date.getSeconds();
		});
		// need to practice ones
		const need_to_practice = current_set_ids.filter((i) => {
			// check if it has audio
			if (selected_mode_name == 'listening' && current_set[i]?.audio == '') {
				return false;
			}
			return (current_set_progress[i]?.learn_stars || 0) < 3;
		});
		if (need_to_practice.length > 0) {
			return need_to_practice[Math.floor(Math.random() * need_to_practice.length)];
		}
		// all are 3 stars
		return null;
	};

	const practiceStateNext = () => {
		if (current_practice_state == null) return;
		current_practice_state.tries_left = 3;
		current_practice_state.done_questions += 1;

		if (selected_mode_name == 'writing') {
			const audio = current_practice_state?.current_item?.audio;
			if (audio) playAudio(audio, true);
		}

		if (
			current_practice_state.max_questions &&
			current_practice_state.done_questions > current_practice_state.max_questions
		) {
			finishPractice();
			return;
		}

		const use_question = lookForNextQuestion();
		if (use_question == null) {
			finishPractice();
			return;
		}

		current_practice_state.current_item = current_practice_state.data[use_question];

		if (selected_mode_name == 'writing') {
			current_practice_state.valid_answers = current_practice_state.current_item.kana
				.split(';')
				.map((s) => s.trim());
		} else {
			current_practice_state.valid_answers = current_practice_state.current_item.word
				.split(';')
				.map((s) => s.trim());
		}
		if (selected_mode_name != 'writing') {
			playAudio(current_practice_state?.current_item?.audio || '', true);
		}
		current_learn_progress = getCurrentLearnProgress();
	};

	/**
	 * @param {SetItem[]} data
	 */
	const startPracticeState = (data) => {
		current_practice_state = {
			current_question: 0,
			done_questions: 0,
			max_questions: current_count_number,
			correct: 0,
			incorrect: 0,
			current_item: null,
			data: data,
			tries_left: 3,
			valid_answers: []
		};
		practiceStateNext();
		current_mode = MODE.PRACTICING;
	};

	/**
	 * @typedef SetItemProgress
	 * @property {number} id
	 * @property {number} learn_stars
	 * @property {string} last_practiced
	 */

	/**
	 * @typedef SetProgress
	 * @property {Object<number, SetItemProgress>} progress_listening
	 * @property {Object<number, SetItemProgress>} progress_reading
	 * @property {Object<number, SetItemProgress>} progress_writing
	 */

	/**
	 * @type {SetProgress}
	 */
	let progress = {
		progress_listening: {},
		progress_reading: {},
		progress_writing: {}
	};

	const getNow = () => {
		return new Date().toISOString();
	};

	/**
	 * @param {number} id
	 * @param {boolean} correct
	 */
	const updateListeningProgressFor = (id, correct) => {
		const old_learn_stars = progress.progress_listening[id]?.learn_stars || 0;
		progress.progress_listening[id] = {
			id: id,
			learn_stars: correct ? old_learn_stars + 1 : 0,
			last_practiced: getNow()
		};
		progress = { ...progress };
	};

	/**
	 * @param {number} id
	 * @param {boolean} correct
	 */
	const updateReadingProgressFor = (id, correct) => {
		const old_learn_stars = progress.progress_reading[id]?.learn_stars || 0;
		progress.progress_reading[id] = {
			id: id,
			learn_stars: correct ? old_learn_stars + 1 : 0,
			last_practiced: getNow()
		};
		progress = { ...progress };
	};

	/**
	 * @param {number} id
	 * @param {boolean} correct
	 */
	const updateWritingProgressFor = (id, correct) => {
		const old_learn_stars = progress.progress_writing[id]?.learn_stars || 0;
		progress.progress_writing[id] = {
			id: id,
			learn_stars: correct ? old_learn_stars + 1 : 0,
			last_practiced: getNow()
		};
		progress = { ...progress };
	};

	/**
	 * @param {number} id
	 * @param {"reading"|"listening"|"writing"} mode
	 * @param {boolean} correct
	 */
	const updateProgressFor = (id, correct, mode) => {
		switch (mode) {
			case 'reading':
				updateReadingProgressFor(id, correct);
				break;
			case 'listening':
				updateListeningProgressFor(id, correct);
				break;
			case 'writing':
				updateWritingProgressFor(id, correct);
				break;
		}
	};

	/**
	 * @param {boolean} is_correct
	 */
	const markCurrent = (is_correct) => {
		if (current_practice_state == null) return;
		if (current_practice_state.current_item == null) return;
		if (is_correct) {
			current_practice_state.correct++;
			updateProgressFor(current_practice_state.current_item.id, is_correct, selected_mode_name);
		} else {
			current_practice_state.incorrect++;
			updateProgressFor(current_practice_state.current_item.id, is_correct, selected_mode_name);
		}
	};

	/**
	 * @param {boolean} correct
	 */
	const goNext = (correct) => {
		incorrect_modal_open = false;
		markCurrent(correct);
		if (correct) {
			toast.push('Correct!', {
				theme: {
					primary: 'green',
					'--toastBarHeight': 0,
					'--toastColor': 'mintcream',
					'--toastBackground': 'rgba(72,187,120,0.9)'
				},
				duration: 1000
			});
			result_player_correct.play();
		} else {
		}

		locked = true;
		setTimeout(() => {
			text_input = '';
			practiceStateNext();
			locked = false;
		}, 1000);
	};

	/**
	 * @param {"reading"|"listening"|"writing"} mode
	 */
	const getLearnProgressSet = (mode) => {
		switch (mode) {
			case 'reading':
				return progress.progress_reading;
			case 'listening':
				return progress.progress_listening;
			case 'writing':
				return progress.progress_writing;
		}
	};

	/**
	 * @param {number} id
	 */
	const getLearnProgressSameMode = (id) => {
		return getLearnProgressSet(selected_mode_name)[id];
	};

	const getCurrentLearnProgress = () => {
		if (current_practice_state == null) return;
		if (current_practice_state.current_item == null) return;
		return getLearnProgressSameMode(current_practice_state.current_item.id);
	};
	let current_learn_progress = getCurrentLearnProgress();

	/**
	 * 
	 * @param {number} total
	 */
	const getCompletion = (total) => {
		const current_set = getLearnProgressSet(selected_mode_name);
		let got = 0;
		for (const key in current_set) {
			const i = current_set[key];
			got += i.learn_stars;
		}
		return [got / (total * 3), got, total];
	};

	const resetProgress = () => {
		progress = {
			progress_listening: {},
			progress_reading: {},
			progress_writing: {}
		};
		selected_mode = selected_mode;
	};

	let text_input = '';

	/**
	 * @param {string} answer
	 */
	const getCorrectnessCurrentAnswer = (answer) => {
		if (current_practice_state == null) return 0.0;
		if (current_practice_state.current_item == null) return 0.0;

		let maximum = 0;
		current_practice_state.valid_answers.forEach((i) => {
			const score = fuzzy(i, answer, {
				ignoreSymbols: true,
				ignoreCase: true
			});
			if (score > maximum) {
				maximum = score;
			}
		});
		return maximum;
	};

	/**
	 * @param {string} answer
	 */
	const getCorrectnessCurrentAnswerFull = (answer) => {
		if (current_practice_state == null) return false;
		if (current_practice_state.current_item == null) return false;

		let correct = false;
		current_practice_state.valid_answers.forEach((i) => {
			if (i == answer) {
				correct = true;
			}
		});
		return correct;
	};

	const { triggerAnimation: triggerShake, animationAction: shakeAction } =
		createAnimationTriggerAction();

	let locked = false;

	let result_player_correct = new Audio('/sounds/correct.mp3');
	result_player_correct.volume = 0.5;
	let result_player_incorrect = new Audio(); // '/sounds/incorrect.mp3'

	let incorrect_modal_open = false;

	/**
	 * @param {number} seconds
	 * @returns {string}
	 */
	const convertSeconds = (seconds) => {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)

	if (hours > 0) {
		return `${hours} hour${hours > 1 ? 's' : ''} : ${minutes} minute${minutes > 1 ? 's' : ''}`
	} else {
		return `${minutes} minute${minutes > 1 ? 's' : ''}`
	}
	}
</script>

<LocalStorage key="count_chosen" bind:value={current_count} />
<LocalStorage key="mode_chosen" bind:value={selected_mode} />
<LocalStorage key={`tango_progress_set_scope${data.scope}_id_${data.file}`} bind:value={progress} />

<SvelteToast />

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
				<br>
				{#key selected_mode}
				<p>{Math.round(getCompletion(got_data.items.length)[0] * 1000) / 10}%, est. {convertSeconds((getCompletion(got_data.items.length)[2] - getCompletion(got_data.items.length)[1]) * 10)}</p>
				{/key}
				<br>
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
				<div class="x-padding"></div>
				<Button iconDescription={'reset progress'} icon={Restart} on:click={() => resetProgress()}
				></Button>
				<div class="bit-padding"></div>
			</div>
		</div>

		{#key selected_mode}
			<div class="word-list">
				<DataTable
					headers={[
						{ key: 'word', value: 'Word' },
						{ key: 'kana', value: 'Kana' },
						{ key: 'audio', value: 'Audio' },
						{ key: 'progress', value: 'Progress' }
					]}
					rows={got_data.items.map((i) => {
						return { ...i, progress: i.id };
					})}
				>
					<svelte:fragment slot="cell" let:row let:cell>
						{#if cell.key === 'kana'}
							<Link href="https://jisho.org/search/{cell.value}">{cell.value}</Link>
						{:else if cell.key === 'audio'}
							<Button
								on:click={() => playAudio(cell.value, false)}
								icon={Play}
								disabled={cell.value == ''}
								tooltipPosition="right"
								iconDescription="Play"
							/>
						{:else if cell.key === 'progress'}
							{#each { length: 3 } as _, i}
								{#if i < (getLearnProgressSameMode(cell.value)?.learn_stars || 0)}
									<StarFilled />
								{:else}
									<Star />
								{/if}
							{/each}
						{:else}
							{cell.value}
						{/if}
					</svelte:fragment>
				</DataTable>
			</div>
		{/key}
	{:else}
		<div class="top-bar">
			{#if current_practice_state?.max_questions}
				<ProgressBar
					hideLabel
					max={current_practice_state?.max_questions}
					value={current_practice_state?.done_questions - 1}
				/>
			{/if}
		</div>
		<div class="mid-content-frame" use:shakeAction>
			<div class="mid-content-frame-child">
				{#if selected_mode_name == 'listening'}
					<Button
						icon={Music}
						iconDescription="Play sound"
						on:click={() => playAudio(current_practice_state?.current_item?.audio || '', false)}
					/>
				{:else}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<p
						class="mid-content-text"
						on:click={() => {
							if (selected_mode_name != 'writing')
								playAudio(current_practice_state?.current_item?.audio || '', false);
						}}
					>
						{selected_mode_name == 'writing'
							? current_practice_state?.current_item?.word || '?'
							: current_practice_state?.current_item?.kana || '?'}
					</p>
				{/if}
			</div>
		</div>
		<div class="bottom-bar">
			<div class="star-holder">
				{#each [0, 1, 2] as i}
					{#if i < (current_learn_progress?.learn_stars || 0)}
						<StarFilled size={32} />
					{:else}
						<Star size={32} />
					{/if}
				{/each}
			</div>
			<div class="bottom-bar-text-area" use:shakeAction>
				<TextInput
					light
					placeholder="Enter answer"
					bind:value={text_input}
					on:keydown={(event) => {
						if (event.key == 'Enter' && !locked) {
							const correctness = getCorrectnessCurrentAnswer(text_input);
							const correct = getCorrectnessCurrentAnswerFull(text_input);

							if (incorrect_modal_open) {
								if (correct) {
									goNext(false);
								} else {}
								return;
							}

							if (correct) {
								goNext(true);
							} else {
								if (correctness < 0.8) {
									incorrect_modal_open = true;
								} else if (current_practice_state != null) {
									current_practice_state.tries_left -= 1;
									if (current_practice_state.tries_left == 0) {
										incorrect_modal_open = true;
										// goNext(false);
									} else {
										toast.push(
											`Incorrect! ${current_practice_state.tries_left} attempt${current_practice_state.tries_left > 1 ? 's' : ''} left.`,
											{
												theme: {
													primary: 'red',
													'--toastBarHeight': 0,
													'--toastColor': 'persimmon',
													'--toastBackground': 'rgba(187,72,72,0.9)'
												},
												duration: 1000
											}
										);
									}

									triggerShake('shake');
								}
							}
						}
					}}
				/>
			</div>
		</div>
	{/if}
{:catch error}
	<p>error: {error.message}</p>
{/await}

<ComposedModal
	open={incorrect_modal_open}
	preventCloseOnClickOutside
	on:click:button--primary={() => {
		goNext(false);
	}}
>
	<ModalHeader title="Incorrect answer" />
	<ModalBody>
		<p>
			Valid Answers are: {current_practice_state?.valid_answers || 'this isnt supposed to happen'}
		</p>
		<br />
		<TextInput
			bind:value={text_input}
			on:keydown={(e) => {
				if (e.key == 'Enter') {
					if (getCorrectnessCurrentAnswerFull(text_input)) {
						incorrect_modal_open = false;
						goNext(false);
					}
				}
			}}
		/>
	</ModalBody>
	<ModalFooter
		primaryButtonText="Next"
		primaryButtonDisabled={getCorrectnessCurrentAnswerFull(text_input) == false}
	/>
</ComposedModal>

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

	.star-holder {
		position: absolute;
		margin-top: 20px;
		margin-bottom: auto;
		margin-left: 20px;
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
		min-height: 265px;
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

	.bit-padding {
		padding-top: 10px;
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

	.x-padding {
		padding-left: 10px;
		display: inline;
	}

	@media only screen and (max-width: 800px) {
		.word-list {
			width: 100%;
			position: relative;
		}
	}

	:global(.shake) {
		animation: shake 1s;
		transform: translate3d(0, 0, 0);
		backface-visibility: hidden;
		perspective: 1000px;
	}

	@keyframes shake {
		10%,
		90% {
			transform: translate3d(-1px, 0, 0);
		}

		20%,
		80% {
			transform: translate3d(2px, 0, 0);
		}

		30%,
		50%,
		70% {
			transform: translate3d(-4px, 0, 0);
		}

		40%,
		60% {
			transform: translate3d(4px, 0, 0);
		}
	}
</style>
