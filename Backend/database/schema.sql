CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE condos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    units_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condo_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    unit TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'morador',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE
);

CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condo_id INTEGER NOT NULL,
    resident_id INTEGER,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'media',
    status TEXT NOT NULL DEFAULT 'aberto',
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

CREATE TABLE notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condo_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    publish_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE
);

CREATE TABLE packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condo_id INTEGER NOT NULL,
    resident_id INTEGER,
    recipient TEXT NOT NULL,
    unit TEXT NOT NULL,
    carrier TEXT,
    tracking_code TEXT,
    status TEXT NOT NULL DEFAULT 'recebida',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TEXT,
    FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condo_id INTEGER NOT NULL,
    resident_id INTEGER,
    space TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);
