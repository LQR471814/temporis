-- add the status field

PRAGMA foreign_keys = OFF;

create table task1 (
	id blob primary key check(is_uuid_v7(id)),
	name text not null,
	comments text not null,
	status int not null,

	timescale int not null,
	timeframe_start int not null,

	assigned_to blob references executor(id)
		on update cascade
		on delete set null,
	parent_id blob not null references task1(id)
		on update cascade
		on delete cascade,

	optimistic real not null,
	expected real not null,
	pessimistic real not null,

	implementation int not null
) strict;

insert into task1 (
	status,
	id,
	name,
	comments,
	timescale,
	timeframe_start,
	assigned_to,
	parent_id,
	optimistic,
	expected,
	pessimistic,
	implementation
)
select
	0 as status,
	id,
	name,
	comments,
	timescale,
	timeframe_start,
	assigned_to,
	parent_id,
	optimistic,
	expected,
	pessimistic,
	implementation
from task;

drop table task;
alter table task1 rename to task;

PRAGMA foreign_keys = ON;
