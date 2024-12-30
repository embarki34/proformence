import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'performance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS organization (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL, 
        wilaya VARCHAR(50) NOT NULL,
        commune VARCHAR(50) NOT NULL,
        name VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS worker (
        id INT PRIMARY KEY AUTO_INCREMENT,
        fullname VARCHAR(50) NOT NULL,
        organization_id INT NOT NULL,
        total_likes INT DEFAULT 0,
        total_dislikes INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS like_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        worker_id INT NOT NULL,
        is_liked BOOLEAN NOT NULL,
        comment TEXT,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES worker(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES worker(id)
      )
    `);

    // Create indexes
    await connection.query('CREATE INDEX IF NOT EXISTS idx_worker_org ON worker(organization_id)');
    await connection.query('CREATE INDEX IF NOT EXISTS idx_like_worker ON like_history(worker_id)');
    await connection.query('CREATE INDEX IF NOT EXISTS idx_org_location ON organization(wilaya, commune)');

    // Create trigger
    await connection.query(`
      CREATE TRIGGER IF NOT EXISTS after_like_insert
      AFTER INSERT ON like_history
      FOR EACH ROW
      BEGIN
        IF NEW.is_liked = TRUE THEN
          UPDATE worker
          SET total_likes = total_likes + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.worker_id;
        ELSE
          UPDATE worker
          SET total_dislikes = total_dislikes + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.worker_id;
        END IF;
      END
    `);

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;
