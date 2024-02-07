export const load = ({ params }) => {
	return {
		scope: params.scope,
		file: params.file,
	};
};
