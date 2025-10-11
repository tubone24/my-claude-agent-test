import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // ファイル名のバリデーション
    if (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
      return NextResponse.json(
        { error: 'Only YAML files are allowed' },
        { status: 400 }
      );
    }

    // 一時ディレクトリのパス（プロジェクトルートの/tmp）
    const tmpDir = path.join(process.cwd(), 'tmp');
    
    // tmpディレクトリが存在しない場合は作成
    if (!existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
    }

    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // ファイル名にタイムスタンプを追加して重複を防ぐ
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = path.join(tmpDir, fileName);

    await writeFile(filePath, buffer);

    console.log('File uploaded:', filePath);

    return NextResponse.json({
      success: true,
      filePath: filePath,
      fileName: fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
