-- seed data
insert into task (
	id,
	name,
	comments,
	parent_id,
	assigned_to,
	timeframe_start,
	timescale,
	optimistic,
	expected,
	pessimistic,
	implementation
) values (
	7425328450300310006, -- id
	'Root', -- name
	'The root task which all tasks originate from.', -- comments
	7425328450300310006, -- parent_id
	null, -- assigned_to
	0, -- timeframe_start
	0, -- timescale
	100, -- optimistic
	100, -- expected
	100, -- pessimistic
	1 -- implementation
)
on conflict do nothing;
