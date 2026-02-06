-- init schema
create table task (
	id int not null primary key,
	name text not null,
	comments text not null,

	timescale int not null,
	timeframe_start int not null,

	assigned_to blob references executor(id)
		on update cascade
		on delete set null,
	parent_id int not null references task(id)
		on update cascade
		on delete cascade,

	optimistic real not null,
	expected real not null,
	pessimistic real not null,

	implementation int not null
) strict;

create table executor (
	id int not null primary key,
	name text not null,
	comments text not null
) strict;

create table executor_occupied (
	executor_id int not null references executor(id)
		on update cascade
		on delete cascade,
	id int not null primary key,
	start int not null,
	end int not null
) strict;

