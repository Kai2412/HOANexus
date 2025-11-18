/**
 * Seed Admin User Script
 * Creates the first admin user for local development
 * 
 * Usage: node backend/scripts/seed-admin-user.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { sql, getMasterConnection, getConnection } = require('../src/config/database');
const config = require('../src/config');

const ADMIN_EMAIL = 'admin@hoanexus.local';
const ADMIN_PASSWORD = 'Admin123!'; // User will be forced to change on first login
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';

async function seedAdminUser() {
  try {
    console.log('🌱 Seeding admin user...\n');

    // Step 1: Get or create organization
    console.log('1. Checking organization...');
    const masterPool = await getMasterConnection();
    let organizationId;
    
    const orgResult = await masterPool.request()
      .input('DatabaseName', sql.NVarChar(100), 'hoa_nexus_testclient')
      .query(`
        SELECT OrganizationID
        FROM dbo.cor_Organizations
        WHERE DatabaseName = @DatabaseName AND IsActive = 1
      `);

    if (orgResult.recordset.length > 0) {
      organizationId = orgResult.recordset[0].OrganizationID;
      console.log('   ✅ Organization found:', organizationId);
    } else {
      console.log('   ⚠️  Organization not found. Please run create-master-database.sql first.');
      process.exit(1);
    }

    // Step 2: Create stakeholder in client database
    console.log('\n2. Creating admin stakeholder in client database...');
    const clientPool = await getConnection();
    
    // Check if stakeholder already exists
    const existingStakeholder = await clientPool.request()
      .input('Email', sql.NVarChar(255), ADMIN_EMAIL)
      .query(`
        SELECT StakeholderID
        FROM dbo.cor_Stakeholders
        WHERE Email = @Email AND IsActive = 1
      `);

    let stakeholderId;
    if (existingStakeholder.recordset.length > 0) {
      stakeholderId = existingStakeholder.recordset[0].StakeholderID;
      console.log('   ✅ Admin stakeholder already exists:', stakeholderId);
    } else {
      const stakeholderResult = await clientPool.request()
        .input('StakeholderID', sql.UniqueIdentifier, sql.UniqueIdentifier().value)
        .input('Type', sql.NVarChar(50), 'Company Employee')
        .input('AccessLevel', sql.NVarChar(50), 'Admin')
        .input('Department', sql.NVarChar(100), 'IT')
        .input('Title', sql.NVarChar(100), 'System Administrator')
        .input('FirstName', sql.NVarChar(100), ADMIN_FIRST_NAME)
        .input('LastName', sql.NVarChar(100), ADMIN_LAST_NAME)
        .input('Email', sql.NVarChar(255), ADMIN_EMAIL)
        .input('PortalAccessEnabled', sql.Bit, true)
        .query(`
          INSERT INTO dbo.cor_Stakeholders (
            StakeholderID, Type, AccessLevel, Department, Title,
            FirstName, LastName, Email, PortalAccessEnabled, IsActive
          )
          OUTPUT INSERTED.StakeholderID
          VALUES (
            NEWID(), @Type, @AccessLevel, @Department, @Title,
            @FirstName, @LastName, @Email, @PortalAccessEnabled, 1
          )
        `);
      
      stakeholderId = stakeholderResult.recordset[0].StakeholderID;
      console.log('   ✅ Created admin stakeholder:', stakeholderId);
    }

    // Step 3: Create UserAccount in master database
    console.log('\n3. Creating admin UserAccount in master database...');
    
    // Check if UserAccount already exists
    const existingUser = await masterPool.request()
      .input('Email', sql.NVarChar(255), ADMIN_EMAIL)
      .query(`
        SELECT UserAccountID
        FROM dbo.sec_UserAccounts
        WHERE Email = @Email AND IsActive = 1
      `);

    if (existingUser.recordset.length > 0) {
      console.log('   ✅ Admin UserAccount already exists:', existingUser.recordset[0].UserAccountID);
      console.log('\n✨ Admin user already exists!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log('   (You will be forced to change password on first login)');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, config.auth.bcryptRounds);
    
    // Set temp password expiry (7 days)
    const tempPasswordExpiry = new Date();
    tempPasswordExpiry.setDate(tempPasswordExpiry.getDate() + 7);

    // Create UserAccount
    const userResult = await masterPool.request()
      .input('OrganizationID', sql.UniqueIdentifier, organizationId)
      .input('Username', sql.NVarChar(255), ADMIN_EMAIL)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Email', sql.NVarChar(255), ADMIN_EMAIL)
      .input('FirstName', sql.NVarChar(100), ADMIN_FIRST_NAME)
      .input('LastName', sql.NVarChar(100), ADMIN_LAST_NAME)
      .input('StakeholderID', sql.UniqueIdentifier, stakeholderId)
      .input('MustChangePassword', sql.Bit, true)
      .input('TempPasswordExpiry', sql.DateTime2, tempPasswordExpiry)
      .query(`
        INSERT INTO dbo.sec_UserAccounts (
          OrganizationID, Username, PasswordHash, Email, FirstName, LastName,
          StakeholderID, MustChangePassword, TempPasswordExpiry, IsActive
        )
        OUTPUT INSERTED.UserAccountID
        VALUES (
          @OrganizationID, @Username, @PasswordHash, @Email, @FirstName, @LastName,
          @StakeholderID, @MustChangePassword, @TempPasswordExpiry, 1
        )
      `);

    const userAccountId = userResult.recordset[0].UserAccountID;
    console.log('   ✅ Created admin UserAccount:', userAccountId);

    console.log('\n✨ Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  You will be forced to change your password on first login.');
    console.log('\n🚀 You can now log in to the application!');

  } catch (error) {
    console.error('\n❌ Error seeding admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
seedAdminUser()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

