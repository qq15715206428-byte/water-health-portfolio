# -*- coding: utf-8 -*-
"""
SQLite 落地验证脚本：执行 schema + 示例查询，打印结果。
用法：python run.py（依赖 Python 内置 sqlite3，无需额外安装）。
"""
import os
import sqlite3

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, "schema.sqlite.sql")
QUERIES = os.path.join(HERE, "queries.sql")
DB = os.path.join(HERE, "water_health.db")


def load_sql(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def main():
    # 每次重建，保证可重复运行
    if os.path.exists(DB):
        os.remove(DB)
    conn = sqlite3.connect(DB)
    conn.executescript(load_sql(SCHEMA))

    # 拆出逐条查询（分号分隔），去掉注释与空行
    sql_text = load_sql(QUERIES)
    statements = []
    for raw in sql_text.split(";"):
        stmt = "\n".join(
            line for line in raw.splitlines()
            if not line.strip().startswith("--")
        ).strip()
        if stmt:
            statements.append(stmt)

    titles = [ln.strip("-- ").strip() for ln in sql_text.splitlines()
              if ln.strip().startswith("-- Q")]

    print("=" * 60)
    print("SQLite 落地验证结果")
    print("=" * 60)

    # 用标题和语句一一对应（标题数与查询数应一致）
    for i, stmt in enumerate(statements):
        title = titles[i] if i < len(titles) else f"查询 {i+1}"
        print(f"\n【{title}】")
        cur = conn.execute(stmt)
        cols = [d[0] for d in cur.description] if cur.description else []
        rows = cur.fetchall()
        print("  " + " | ".join(cols))
        for row in rows:
            print("  " + " | ".join(str(v) for v in row))
        print(f"  （{len(rows)} 行）")

    conn.close()
    print("\n" + "=" * 60)
    print(f"验证通过：schema 与 {len(statements)} 条查询均成功执行。")
    print(f"数据库文件：{DB}")
    print("=" * 60)


if __name__ == "__main__":
    main()
