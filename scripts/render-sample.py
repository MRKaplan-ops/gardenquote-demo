# Procedural stand-in for public/sample-garden.jpg (no network needed). Replace with a real photo or run `npm run sample` for an AI photo.
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from scipy.ndimage import gaussian_filter
W,H,h0=1600,1067,430
Y,X=np.mgrid[0:H,0:W].astype(np.float32)
def nz(s,seed):
    n=np.random.default_rng(seed).standard_normal((H,W)).astype(np.float32);n=gaussian_filter(n,s);return n/n.std()
def hsh(a,b,s=0): return (np.sin(a*127.1+b*311.7+s*74.7)*43758.5453)%1.0
img=np.zeros((H,W,3),np.float32);img[:]=np.array([205,210,214])
roof=(Y>=70)&(Y<118);img[roof]=(np.array([70,68,72])*(1-((Y-70)/48*.3)[...,None])+nz(1.5,1)[...,None]*4)[roof]
yb=Y-118;row=np.floor(yb/24);xb=X+(row%2)*36;col=np.floor(xb/72);r=hsh(row,col)[...,None]
base=np.array([150,78,58])+(r-.5)*np.array([50,30,25]);mort=((yb%24)<3)|((xb%72)<3)
br=np.where(mort[...,None],np.array([178,172,162]),base)+nz(1,2)[...,None]*5;wall=(Y>=118)&(Y<h0);img[wall]=br[wall]
def glass(x0,x1,y0,y1,fr=10):
    img[(X>=x0)&(X<x1)&(Y>=y0)&(Y<y1)]=np.array([226,226,224]);inner=(X>=x0+fr)&(X<x1-fr)&(Y>=y0+fr)&(Y<y1-fr)
    gr=np.clip((Y-y0)/(y1-y0),0,1)[...,None];gl=np.array([95,110,120])*(1-gr)+np.array([40,48,52])*gr+nz(25,3)[...,None]*6
    img[inner]=gl[inner];img[(abs(X-(x0+x1)/2)<fr/2)&inner]=np.array([226,226,224])
glass(610,1020,180,h0+2);glass(190,430,200,340,8)
d=np.clip(Y-h0,0,None)+40;u=(X-W/2)/d*4.5;v=6110/d;iu=np.floor(u);iv=np.floor(v);fu=u-iu;fv=v-iv
joint=(fu<.035)|(fu>.965)|(fv<.04)|(fv>.96)
sh=135+hsh(iu,iv,1)*22-11+nz(40,4)*7+nz(1.2,5)*4;conc=np.stack([sh,sh-1,sh-3],-1);conc[...,1]+=np.clip(nz(60,6),0,None)*4
weed=(hsh(X*.37,Y*.53,2)<.22)&joint
gd=np.where(joint[...,None],np.where(weed[...,None],np.array([70,108,48]),np.array([62,62,56])),conc)
lawn=np.clip(((X-860)+nz(90,7)*150)/140,0,1)*(Y>h0+60)
gn=nz(.8,8)*.6+nz(3,9)*.6;gc=np.stack([68+gn*14+nz(35,10)*8,100+gn*18+nz(35,10)*10,42+gn*8],-1)
gd=gd*(1-lawn[...,None])+gc*lawn[...,None];hz=np.clip(1-(Y-h0)/160,0,1)[...,None]*.5;gd=gd*(1-hz)+np.array([170,172,170])*hz
g=Y>=h0;img[g]=gd[g]
def fence(x0,x1,y0,y1):
    m=(X>=x0)&(X<x1)&(Y>=y0)&(Y<y1);b=hsh(np.floor((X-x0)/26),0,3)[...,None];c=np.array([112,86,60])*(0.8+b*.35)
    gr=gaussian_filter(np.random.default_rng(12).standard_normal((H,W)).astype(np.float32),(18,.8));c=c+gr[...,None]*14
    c=np.where((((X-x0)%26)<2)[...,None],np.array([40,32,26]),c);img[m]=c[m]
fence(0,230,150,h0+75);fence(1370,1600,150,h0+75)
def shrubs(items):
    global img
    for cx,cy,rx,ry,col in items:
        m=Image.new('L',(W,H),0);ImageDraw.Draw(m).ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=255)
        m=(np.asarray(m.filter(ImageFilter.GaussianBlur(5)),np.float32)/255)[...,None]
        tx=nz(1.5,int(cx+cy))*.5+nz(6,int(cx))*.7;c=np.array(col)*(1+tx[...,None]*.18)*np.clip(1-(Y-cy)/ry*.25,.6,1.1)[...,None]
        img=img*(1-m)+c*m
shrubs([(110,520,110,70,(58,92,48)),(250,540,90,55,(74,105,52)),(60,600,70,50,(52,84,44)),(1470,520,120,75,(60,96,50)),(1330,545,90,50,(80,110,55)),(1540,610,70,55,(54,88,46))])
vig=1-0.22*(((X-W/2)/(W/2))**2+((Y-H/2)/(H/2))**2)/2;img=img*vig[...,None];img=img*.92+img.mean(-1,keepdims=True)*.08
I=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.9))
a=np.asarray(I,np.float32)+np.random.default_rng(99).standard_normal((H,W,1))*3.2
Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save('public/sample-garden.jpg',quality=90)
