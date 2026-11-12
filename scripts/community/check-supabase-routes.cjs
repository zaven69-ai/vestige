/* global __dirname */
// Local PostgreSQL check. The auth.users and JWT fixtures model database
// identities, without testing GoTrue, mail delivery or session persistence.
const { PGlite } = require(process.env.PGLITE_MODULE || "@electric-sql/pglite");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

async function main() {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const reader = "22222222-2222-4222-8222-222222222222";
  const stops = "array['saint-jean','fourviere']";
  const query = async (sql) => (await db.query(sql)).rows;
  const login = async (id) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      id,
    ]);
    await db.exec("set role authenticated");
  };
  const save = (id, title, visibility, poiIds = stops) =>
    query(
      `select public.vestige_save_route(${id ? `'${id}'` : "null"}, '${title}', '', null, ${poiIds}, '${visibility}') as id`,
    );
  const sqlState = (code) => (error) => error.code === code;

  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
    `);
    for (const file of [
      "20261111163805_vestige_community_foundation.sql",
      "20261111171902_vestige_save_route.sql",
    ]) {
      await db.exec(
        readFileSync(
          resolve(__dirname, "../../supabase/migrations", file),
          "utf8",
        ),
      );
    }
    await db.query("insert into auth.users values ($1), ($2)", [owner, reader]);
    await login(owner);
    assert.equal((await query("select id from profiles")).length, 2);
    const [{ id }] = await save(null, "Circuit de Lyon", "draft");
    const [post] =
      await query(`insert into community_posts(author_id,title,body)
      values ('${owner}','Souvenir de Lyon','Une découverte à Lyon') returning id`);
    const route = `where id = '${id}'`;
    const routeStops = `where route_id = '${id}'`;

    await login(reader);
    assert.deepEqual(
      await query(`select id from community_routes ${route}`),
      [],
    );
    assert.deepEqual(
      await query(`select id from community_route_stops ${routeStops}`),
      [],
    );
    assert.deepEqual(
      await query(`select id from community_posts where id = '${post.id}'`),
      [],
    );

    await login(owner);
    await assert.rejects(
      query(`insert into community_routes(author_id,title,visibility)
      values ('${owner}','Circuit vide','published')`),
      sqlState("23514"),
    );
    const [empty] = await query(`insert into community_routes(author_id,title)
      values ('${owner}','Circuit vide') returning id`);
    await assert.rejects(
      query(`update community_routes set visibility='published'
      where id='${empty.id}'`),
      sqlState("23514"),
    );
    await assert.rejects(
      save(
        id,
        "Circuit invalide",
        "published",
        "array['fourviere','fourviere']",
      ),
      sqlState("22023"),
    );
    await save(id, "Circuit de Lyon", "published");
    await query(
      `update community_posts set visibility='published' where id='${post.id}'`,
    );
    const before = await query(
      `select id, poi_id from community_route_stops ${routeStops} order by position`,
    );
    await save(id, "Lyon historique", "published");
    assert.deepEqual(
      await query(
        `select id, poi_id from community_route_stops ${routeStops} order by position`,
      ),
      before,
    );
    await assert.rejects(
      save(
        id,
        "Circuit modifié",
        "published",
        "array['fourviere','saint-jean']",
      ),
      sqlState("23514"),
    );
    for (const sql of [
      `insert into community_route_stops(route_id,position,poi_id) values ('${id}',3,'theatre-lyon')`,
      `update community_route_stops set note = 'modifié' ${routeStops}`,
      `delete from community_route_stops ${routeStops}`,
      `update community_routes set visibility='draft' ${route}`,
    ])
      await assert.rejects(query(sql), sqlState("23514"));

    await login(reader);
    assert.deepEqual(
      await query(`select title from community_routes ${route}`),
      [{ title: "Lyon historique" }],
    );
    assert.deepEqual(
      await query(
        `select id, poi_id from community_route_stops ${routeStops} order by position`,
      ),
      before,
    );
    assert.deepEqual(
      await query(`select id from community_posts where id='${post.id}'`),
      [post],
    );
    assert.deepEqual(
      await query(
        `update community_routes set title='Modification' ${route} returning id`,
      ),
      [],
    );
    assert.deepEqual(
      await query(`delete from community_routes ${route} returning id`),
      [],
    );
    assert.deepEqual(
      await query(
        `update community_posts set title='Modification' where id='${post.id}' returning id`,
      ),
      [],
    );
    assert.deepEqual(
      await query(
        `delete from community_posts where id='${post.id}' returning id`,
      ),
      [],
    );
    await assert.rejects(
      save(id, "Modification", "published"),
      sqlState("42501"),
    );
    await query(
      `insert into saved_community_routes(user_id, route_id) values ('${reader}','${id}')`,
    );
    await query(
      `insert into community_reports(reporter_id, route_id, reason) values ('${reader}','${id}','Vérification')`,
    );
    assert.equal(
      (await query("select route_id from saved_community_routes")).length,
      1,
    );
    assert.equal(
      (await query("select route_id from community_reports")).length,
      1,
    );

    await login(owner);
    assert.deepEqual(
      await query("select route_id from saved_community_routes"),
      [],
    );
    assert.deepEqual(await query("select route_id from community_reports"), []);
    await assert.rejects(
      query("truncate community_routes cascade"),
      sqlState("42501"),
    );
    assert.deepEqual(
      await query(`delete from community_routes ${route} returning id`),
      [{ id }],
    );
    await login(reader);
    assert.deepEqual(
      await query("select route_id from saved_community_routes"),
      [],
    );
    assert.deepEqual(
      await query(`select id from community_route_stops ${routeStops}`),
      [],
    );
    console.log(
      "Supabase SQL: publication, étapes, partage A/B et isolation RLS vérifiés.",
    );
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
