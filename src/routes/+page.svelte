<script>
	import {
		DataTable,
		Button,
		Link,
		Tabs,
		Tab,
		TextInput,
		LocalStorage,
		FileUploaderDropContainer,
		Theme,
	} from 'carbon-components-svelte';
	import { Pen, TrashCan } from 'carbon-icons-svelte';

	import "carbon-components-svelte/css/all.css";

	/**
	 * @typedef {import('$lib/set').SetData} SetData
	 * @typedef {import('$lib/set').SetItem} SetItem
	 *
	 */

	/**
	 * @type {import('$lib/set').LocalList[]}
	 */
	let local_lists = [];

	async function getAvailable() {
		const res = await fetch(`/api/get-src?resource=available`);
		const data = await res.json();
		/**
		 * 
		 * @param {any} entry
		 */
		function mapper(entry) {
			return {
				id: entry[0],
				name: entry
			};
		}
		return data.map(mapper);
	}

	const presets = getAvailable();
</script>

<LocalStorage key="local_lists" bind:value={local_lists} />


<div class="content">
	<Theme
	render="toggle"
	persist
	persistKey="__theme"
	
	theme="g100"
	toggle={{
		themes: ["g100", "g10"],
		labelA: "Toggle light mode",
		labelB: "Toggle light mode",
		hideLabel: true,
		size: "sm",
	}}
	/>
	<br>
	<p>Make your own</p>
	<br />
	<Button
		iconDescription={'Create new list'}
		icon={Pen}
		on:click={() => {
			window.location.href = '/edit';
		}}
	/>
	<br />
	<br />
	<p>Or choose from the available lists:</p>
	<br />
	{#await presets}
		loading...
	{:then found}
		<DataTable
			headers={[
				{
					key: 'name',
					value: 'Name'
				}
			]}
			rows={found}
		>
			<svelte:fragment slot="cell" let:row let:cell>
				{#if cell.key === 'name'}
					<Link href="/do/preset-{cell.value[0]}">{cell.value[1]}</Link>
				{/if}
			</svelte:fragment>
		</DataTable>
	{:catch _}
		<p>Failed to load available lists</p>
	{/await}
	<br />
	<p>Local lists:</p>
	<br />

	<FileUploaderDropContainer
		labelText="Add to local list"
		accept={['.json']}
		on:change={async (e) => {
			// set edit data to the file
			const file = e.detail[0];
			const txt = await file.text();
			/**
			 * @type {SetData}
			 */
			const json_parsed = JSON.parse(txt);
			if (local_lists.find((entry) => entry.id === json_parsed.info.name)) {
				if (confirm('This list already exists. Do you want to overwrite it?')) {
					local_lists = local_lists.map((entry) => {
						if (entry.id === json_parsed.info.name) {
							return {
								id: entry.id,
								json: txt
							};
						}
						return entry;
					});
				}
			} else {
				local_lists = [
					...local_lists,
					{
						id: json_parsed.info.name,
						json: txt
					}
				];
			}
		}}
	/>
	<DataTable
		headers={[
			{
				key: 'id',
				value: 'Name'
			},
			{
				key: 'btn',
				value: ''
			}
		]}
		rows={local_lists}
	>
		<svelte:fragment slot="cell" let:row let:cell>
			{#if cell.key == 'btn'}
				<Button
					icon={TrashCan}
					iconDescription={'delete'}
					kind="danger"
					on:click={() => {
						if (confirm('Are you sure you want to delete this list?'))
							local_lists = local_lists.filter((entry) => entry.id !== row.id);
					}}
				/>
			{:else if cell.key === 'id'}
				<Link href="/do/local-{row.id}">{row.id}</Link>
			{:else}
				{cell.value}
			{/if}
		</svelte:fragment>
	</DataTable>
</div>

<style>
	.content {
		padding-left: 20px;
		padding-top: 20px;
	}
</style>
