/* global __dirname */
/* Maintainer-only PostgreSQL RLS test. PGLITE_MODULE points to an external install.
   No cloud project is touched. Storage bucket/GoTrue tables are structural fixtures. */
const { PGlite } = require(process.env.PGLITE_MODULE || "@electric-sql/pglite");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
(async () => {
  const db = new PGlite();
  const a = "11111111-1111-4111-8111-111111111111",
    b = "22222222-2222-4222-8222-222222222222",
    content = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage;
      create table auth.users(id uuid primary key); insert into auth.users values('${a}'),('${b}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
      grant usage on schema public,auth to anon,authenticated,service_role; grant execute on all functions in schema auth to anon,authenticated,service_role;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    await db.exec(
      fs.readFileSync(
        path.resolve(
          __dirname,
          "../../supabase/drafts/202611110001_community.sql",
        ),
        "utf8",
      ),
    );
    await db.exec(
      `insert into community_poi_catalogue values('saint-jean'),('fourviere'); grant all on all tables in schema public to service_role;`,
    );
    const login = async (id, role = "authenticated") => {
      await db.exec(
        `reset role; select set_config('request.jwt.claim.sub','${id}',false); select set_config('request.jwt.claim.role','${role}',false); set role ${role};`,
      );
    };
    const count = async (sql) => (await db.query(sql)).rows[0].n;
    const denied = async (sql) => {
      let failed = false;
      try {
        await db.exec(sql);
      } catch {
        failed = true;
      }
      assert.equal(failed, true, sql);
    };
    await login(a);
    await db.exec(
      `insert into community_profiles(id,alias) values('${a}','Auteur A'); insert into community_contents(id,author_id,kind,title,poi_ids,visibility,moderation,content_status) values('${content}','${a}','route','Parcours A',array['saint-jean','fourviere'],'public','accepted','live_editorial_approved');`,
    );
    assert.deepEqual(
      (
        await db.query(
          `select moderation,content_status from community_contents`,
        )
      ).rows[0],
      {
        moderation: "pending",
        content_status: "community_published_unverified",
      },
    );
    await login(b);
    await db.exec(
      `insert into community_profiles(id,alias) values('${b}','Auteur B')`,
    );
    assert.equal(
      await count(`select count(*)::int n from community_contents`),
      0,
    );
    assert.equal(
      await count(
        `select count(*)::int n from community_profiles where id='${a}'`,
      ),
      0,
    );
    await denied(
      `insert into community_contents(author_id,kind,title,poi_ids) values('${a}','route','Forgery',array['saint-jean','fourviere'])`,
    );
    await db.exec(
      `update community_contents set title='Forgery' where id='${content}'; delete from community_contents where id='${content}';`,
    );
    await login(a);
    assert.equal(
      (await db.query(`select title from community_contents`)).rows[0].title,
      "Parcours A",
    );
    await denied(
      `insert into community_contents(author_id,kind,title,poi_ids) values('${a}','route','Unknown',array['saint-jean','private-home'])`,
    );
    await login("", "anon");
    assert.equal(
      await count(`select count(*)::int n from community_contents`),
      0,
    );
    await denied(
      `insert into community_profiles(id,alias) values('${a}','Anon')`,
    );
    await login("", "service_role");
    await db.exec(
      `update community_contents set moderation='accepted',content_status='historically_verified' where id='${content}'`,
    );
    await login(b);
    assert.equal(
      await count(`select count(*)::int n from community_contents`),
      1,
    );
    assert.equal(
      await count(
        `select count(*)::int n from community_profiles where id='${a}'`,
      ),
      1,
    );
    await db.exec(
      `insert into community_saves values('${b}','${content}'); insert into community_reports(reporter_id,content_id,reason,state) values('${b}','${content}','Test','reviewed')`,
    );
    assert.equal(
      (await db.query(`select state from community_reports`)).rows[0].state,
      "pending",
    );
    await denied(`insert into community_saves values('${a}','${content}')`);
    await login(a);
    assert.equal(
      await count(`select count(*)::int n from community_reports`),
      0,
    );
    assert.equal(await count(`select count(*)::int n from community_saves`), 0);
    await db.exec(
      `update community_contents set body='Nouvelle version' where id='${content}'`,
    );
    assert.deepEqual(
      (
        await db.query(
          `select moderation,content_status,version from community_contents`,
        )
      ).rows[0],
      {
        moderation: "pending",
        content_status: "community_published_unverified",
        version: 2,
      },
    );
    await login(b);
    assert.equal(
      await count(`select count(*)::int n from community_contents`),
      0,
    );
    await login(a);
    for (let i = 0; i < 19; i++)
      await db.exec(
        `insert into community_contents(author_id,kind,title,poi_ids) values('${a}','route','Quota ${i}',array['saint-jean','fourviere'])`,
      );
    await db.exec(`delete from community_contents where title like 'Quota %'`);
    await denied(
      `insert into community_contents(author_id,kind,title,poi_ids) values('${a}','route','Quota excess',array['saint-jean','fourviere'])`,
    );
    await db.exec(`delete from community_profiles where id='${a}'`);
    assert.equal(
      await count(`select count(*)::int n from community_contents`),
      0,
    );
    console.log(
      JSON.stringify(
        {
          passed: true,
          checks: [
            "migration SQL compiles",
            "two independent JWT subjects",
            "private drafts invisible to other account and anonymous",
            "author-only edit/delete",
            "forged approval reset",
            "unknown POIs rejected",
            "service-only review",
            "public accepted reading",
            "reports and saves private",
            "edit invalidates historical verification",
            "publication rate limit",
            "profile erasure cascades",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
