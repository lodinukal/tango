<script>
	import { DataTable, Button, Link, Tabs, Tab, TextInput } from 'carbon-components-svelte';
	import { Pen } from 'carbon-icons-svelte';

	import 'carbon-components-svelte/css/g100.css';
	import available from '$lib/available.json';

	const presets = available.map((entry) => {
		return {
			id: entry[0],
			name: entry
		};
	});
</script>

<div class="content">
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
	<DataTable
		headers={[
			{
				key: 'name',
				value: 'Name'
			}
		]}
		rows={presets}
	>
		<svelte:fragment slot="cell" let:row let:cell>
			{#if cell.key === 'name'}
				<Link href="/do/{cell.value[0]}">{cell.value[1]}</Link>
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
