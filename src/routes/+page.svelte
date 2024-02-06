<script>
	import { DataTable, Button, Link, Tabs, Tab, TextInput } from 'carbon-components-svelte';
	import { Play, Rocket, ArrowLeft, Music } from 'carbon-icons-svelte';

	import 'carbon-components-svelte/css/g100.css';
	import available from '$lib/available.json';

	const presets = available.map((entry) => {
		return {
			id: entry[0],
			name: entry
		};
	});
</script>

<h3>Available lists:</h3>
<li>
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
</li>
