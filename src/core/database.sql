create TABLE table_user
(
 _id SERIAL  NOT NULL UNIQUE,
 fullname VARCHAR (255) NOT NULL,
 email VARCHAR (255) NOT NULL,
 password VARCHAR (255) NOT NULL,
 avatar VARCHAR (255),
);

create TABLE dialog (
_id SERIAL  NOT NULL UNIQUE,
author_id INTEGER REFERENCES user (_id) NOT NULL,
partner_id INTEGER REFERENCES user (_id) NOT NULL,
);

create TABLE message (
_id SERIAL  NOT NULL UNIQUE,
text VARCHAR (1000) NOT NULL,
createdAt TIMESTAMP NOT NULL,
dialog_id INTEGER REFERENCES dialog (_id) NOT NULL,
author_id INTEGER REFERENCES user (_id) NOT NULL,

);

CREATE TABLE user_dialog(
    _id SERIAL NOT NULL UNIQUE,
    id_user INTEGER REFERENCES user (_id) on delete cascade not null,
    id_dialog INTEGER REFERENCES dialog(_id) on delete cascade not null
);

